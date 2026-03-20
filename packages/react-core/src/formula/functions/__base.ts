import { type Sheet } from '../../lib/sheet';

/** Duck-type check for Sheet instances (avoids runtime import cycle). */
export const isSheet = (v: any): v is Sheet => v?.__isSheet === true;
/** Duck-type check for Time instances (avoids runtime import cycle). */
const isTime = (v: any): boolean => v != null && v.__gsType === 'Time';
import { Spilling } from '../../sentinels';
import type { Id } from '../../types';
import { FormulaError } from '../formula-error';
import { stripSheet } from '../../formula/solver';
import type { Expression } from '../evaluator';
import {
  hasPendingArg,
  hasDeepPending,
  buildAsyncCacheKey,
  awaitAndSave,
  createPropagatedPending,
  getAsyncCache,
  asyncCacheMiss,
} from './__async';
import { Time } from '../../lib/time';

export type FunctionCategory =
  | 'math'
  | 'statistics'
  | 'text'
  | 'time'
  | 'lookup'
  | 'information'
  | 'finance'
  | 'engineering'
  | 'logical'
  | 'other';

export type FunctionProps = {
  args: Expression[];
  sheet: Sheet;
  at?: Id;
};

export type FunctionArgumentType = 'number' | 'string' | 'boolean' | 'date' | 'time' | 'matrix' | 'reference' | 'any';

export type FunctionArgumentDefinition = {
  name: string;
  description: string;
  // if true, this argument can be omitted (i.e. fewer args than defs.length is allowed)
  optional?: boolean;
  // If true, blank will be treated as 0 for numbers, "" for strings, etc. Default: true
  nullable?: boolean;
  variadic?: boolean;

  errorTolerant?: boolean;
  acceptedTypes?: FunctionArgumentType[];
  /** When true, this argument takes a range/matrix value — broadcasting is suppressed for it. */
  takesMatrix?: boolean;
};

export const conditionArg: FunctionArgumentDefinition = {
  name: 'condition',
  description:
    'The condition to evaluate. Use "=" for equal, "<" for less than, ">" for greater than, "<=" for less than or equal, ">=" for greater than or equal, "<>" for not equal.',
  acceptedTypes: ['any'],
};

/**
 * Check whether a value matches one of the allowed type names
 * from a FunctionArgumentDefinition.acceptedTypes array.
 */
const matchesType = (
  value: any,
  { nullable = true, errorTolerant = false, acceptedTypes }: FunctionArgumentDefinition,
): boolean => {
  if (!acceptedTypes || acceptedTypes.length === 0) {
    return true;
  }
  if (value == null) {
    return nullable;
  }
  if (FormulaError.is(value) || value instanceof Error) {
    if (errorTolerant) {
      return true;
    }
    throw value;
  }
  for (const t of acceptedTypes) {
    switch (t) {
      case 'any':
        return true;
      case 'number':
        if (typeof value === 'number') {
          return true;
        }
        break;
      case 'string':
        if (typeof value === 'string') {
          return true;
        }
        break;
      case 'boolean':
        if (typeof value === 'boolean') {
          return true;
        }
        break;
      case 'date':
        if (value instanceof Date) {
          return true;
        }
        break;
      case 'time':
        if (Time.is(value)) {
          return true;
        }
        break;
      case 'matrix':
        if (isMatrix(value)) {
          return true;
        }
        break;
      case 'reference':
        if (isSheet(value)) {
          return true;
        }
        break;
    }
  }
  return false;
};

/**
 * Check if a value is a "matrix" (Sheet, Spilling, or 2D array).
 */
export const isMatrix = (value: any): boolean => {
  return isSheet(value) || Spilling.is(value) || (Array.isArray(value) && Array.isArray(value[0]));
};

/**
 * Extract the scalar from a 1×1 matrix (Sheet, Spilling, or plain 2D array).
 * Returns the value unchanged if it is not a matrix.
 */
export const stripMatrix = (value: any, at: Id): any => {
  if (!isMatrix(value)) {
    return value;
  }
  if (isSheet(value)) {
    return stripSheet({ value, raise: false });
  }
  const m: any[][] = Spilling.is(value) ? value.matrix : value;
  let val = m?.[0]?.[0];
  return val;
};

/**
 * Check if a value is a matrix that is larger than 1×1.
 */
export const isMultiCell = (value: any): boolean => {
  if (isSheet(value)) {
    return !value.hasSingleCell;
  }
  if (Spilling.is(value)) {
    const m = value.matrix;
    return m.length > 1 || (m.length === 1 && m[0].length > 1);
  }
  if (Array.isArray(value) && Array.isArray(value[0])) {
    return value.length > 1 || value[0].length > 1;
  }
  return false;
};

/**
 * Resolve which FunctionArgumentDefinition index each args position maps to,
 * accounting for variadic args at the tail.
 *
 * Example: args = [A, B(variadic), C(variadic)], args has 7 elements
 *   positions 0 → A, 1 → B, 2 → C, 3 → B, 4 → C, 5 → B, 6 → C
 */
const resolveParamIndex = (defs: FunctionArgumentDefinition[], argCount: number): number[] => {
  const indices: number[] = [];

  // Find the first variadic arg position
  let iterStart = -1;
  let iterCount = 0;
  for (let i = 0; i < defs.length; i++) {
    if (defs[i].variadic) {
      if (iterStart < 0) {
        iterStart = i;
      }
      iterCount++;
    }
  }

  for (let i = 0; i < argCount; i++) {
    if (iterStart >= 0 && i >= iterStart) {
      // Map extra args round-robin across variadic args
      const j = (i - iterStart) % iterCount;
      indices.push(iterStart + j);
    } else if (i < defs.length) {
      indices.push(i);
    } else {
      // Beyond defs and no variadic — fall back to last def
      indices.push(defs.length - 1);
    }
  }
  return indices;
};

export class BaseFunction {
  public defs: FunctionArgumentDefinition[] = [];
  public example: string | undefined;
  public description = '';
  public category: FunctionCategory = 'other';
  /** Indicates if this function is async. Override in subclass or use BaseFunctionAsync. */
  protected isAsync: boolean = false;
  /** Cache TTL in milliseconds. Override in subclass to set expiry. undefined = never expires. */
  protected ttlMilliseconds?: number;
  /** Hash precision for cache key generation. Higher values reduce collision risk. Default: 1 */
  protected hashPrecision: number = 1;
  /** If true, reuse the same in-flight promise for matching cache keys across different cells. */
  protected useInflight: boolean = true;
  /** If true, broadcasting is unconditionally disabled for this function. */
  protected broadcastDisabled: boolean = false;
  protected args: any[];
  protected autoSpilling: boolean = false;
  public sheet: Sheet;
  public at: Id;
  static __name = '';

  constructor({ args, sheet, at }: FunctionProps) {
    this.args = args.map((a) => {
      try {
        return a.evaluate({ sheet });
      } catch (e) {
        return e;
      }
    });
    this.sheet = sheet;
    this.at = at ?? '?';
  }

  private _main(...args: any[]): any {
    if (this.autoSpilling) {
      // @ts-expect-error main is not defined in BaseFunction
      return new Spilling(this.main(...args));
    }
    // @ts-expect-error main is not defined in BaseFunction
    return this.main(...args);
  }

  /**
   * Validate and normalise arguments before `main()` is called.
   *
   * Checks:
   * 1. Argument count satisfies defs (respecting optional / variadic).
   * 2. Each argument's runtime type matches the corresponding def's `type` list.
   *
   * Subclasses may override for additional coercion / spreading.
   */
  protected validate(args: any[]): any[] {
    const validatedArgs = [...args];

    const defs = this.defs;
    if (defs.length === 0) {
      if (args.length !== 0) {
        throw new FormulaError('#N/A', 'Too many arguments: expected 0, got ' + args.length + '.');
      }
      return validatedArgs;
    }

    // --- argument count check ---
    // minArgs: count of defs that are neither optional nor variadic,
    //          plus non-optional variadic defs (need at least one instance each).
    let minArgs = 0;
    let hasIterable = false;
    let variadicCount = 0;
    for (const d of defs) {
      if (d.variadic) {
        hasIterable = true;
        variadicCount++;
        if (!d.optional) {
          minArgs++;
        }
      } else if (!d.optional) {
        minArgs++;
      }
    }

    if (args.length < minArgs) {
      throw new FormulaError('#N/A', `Too few arguments: expected at least ${minArgs}, got ${args.length}.`);
    }

    // maxArgs: if no variadic defs, max = defs.length
    if (!hasIterable && args.length > defs.length) {
      throw new FormulaError('#N/A', `Too many arguments: expected at most ${defs.length}, got ${args.length}.`);
    }

    // --- per-argument type check ---
    const indices = resolveParamIndex(defs, args.length);
    for (let i = 0; i < args.length; i++) {
      const def = defs[indices[i]];
      if (!def) {
        continue;
      }
      let value = args[i];
      if (!def.acceptedTypes || def.acceptedTypes.length === 0) {
        continue;
      }

      if (isMultiCell(value)) {
        if (!def.takesMatrix) {
          continue;
        }
      } else if (isMatrix(value)) {
        // For 1x1 Sheet, Spilling, or plain 2D array, extract the single value for validation.
        // UNLESS the definition explicitly takes a matrix (e.g. SUM(A1) — let it pass through).
        if (!def.takesMatrix) {
          value = stripMatrix(value, this.at);
        }
      }
      if (!matchesType(value, def)) {
        throw new FormulaError(
          '#VALUE!',
          `Argument "${def.name}" (position ${i + 1}) expected ${def.acceptedTypes.join(' | ')}, got ${typeof value}.`,
        );
      }
      validatedArgs[i] = value;
    }
    return validatedArgs;
  }

  eachMatrix = (value: any, callback: (v: any) => void) => {
    if (isSheet(value)) {
      const matrix = value.solve({ at: this.at, raise: true });
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          callback(matrix[r][c]);
        }
      }
    } else if (Spilling.is(value)) {
      const matrix = value.matrix;
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          callback(matrix[r][c]);
        }
      }
    } else if (Array.isArray(value) && Array.isArray(value[0])) {
      for (let r = 0; r < value.length; r++) {
        for (let c = 0; c < value[r].length; c++) {
          callback(value[r][c]);
        }
      }
    } else {
      callback(value);
    }
  };

  /**
   * Extract a 2D array from a matrix value (Spilling, Sheet, or nested array).
   * Default behavior for Sheet is value.solve(). Functions like COL can override
   * this to preserve Sheet metadata per cell.
   */
  protected toMatrix(value: any): any[][] {
    if (Spilling.is(value)) {
      return value.matrix;
    }
    if (isSheet(value)) {
      return value.solve({ at: this.at });
    }
    if (Array.isArray(value) && Array.isArray(value[0])) {
      return value;
    }
    return [[value]];
  }

  /**
   * Collapse a 1×1 matrix value (Sheet, Spilling, or 2D array) to a scalar.
   * Non-matrix values pass through unchanged.
   *
   * Override in sub-classes that need the original Sheet / reference
   * metadata (e.g. COL, ROW) — for instance, to extract position
   * information before collapsing.
   */
  protected toScalar(value: any): any {
    if (isSheet(value)) {
      const { rows, cols } = value.shape;
      if (rows === 1 && cols === 1) {
        return value.strip();
      }
      return value;
    }
    if (Spilling.is(value)) {
      return value.matrix?.[0]?.[0];
    }
    if (Array.isArray(value)) {
      if (Array.isArray(value[0])) {
        return value[0]?.[0];
      }
      return value[0];
    }
    return value;
  }

  public call() {
    // Broadcast BEFORE validate, because validate may strip Tables to scalars.
    // broadcast only activates when there are 2+ args and at least one
    // broadcastable arg is a multi-cell matrix.
    const broadcastResult = this.broadcast();
    if (broadcastResult !== undefined) {
      return broadcastResult;
    }

    // If any argument is still pending, propagate before validate runs
    // (Pending values would fail type checks in validate).
    if (hasDeepPending(this.args, this.at)) {
      return createPropagatedPending();
    }

    this.args = this.validate(this.args);

    // For async functions, build cache key and check cache before execution
    if (this.isAsync) {
      const key = buildAsyncCacheKey(this.constructor.name, this.args, this.hashPrecision);
      const cached = getAsyncCache(this.sheet, this.at, key, this.useInflight);
      if (cached !== asyncCacheMiss) {
        return cached;
      }

      const promise = this._main(...this.args);
      return awaitAndSave(promise, this.sheet, this.at, key, this.ttlMilliseconds, this.useInflight);
    }

    // For sync functions, just call and return
    return this._main(...this.args);
  }

  /**
   * If any broadcastable argument is a matrix (multi-cell), expand the call
   * across all element positions and return a Spilling.
   * Returns `undefined` when no broadcast is necessary.
   *
   * Rules:
   * - broadcastDisabled = true → never broadcast
   * - An arg is broadcastable when its corresponding args[].takesMatrix is not true
   * - A Sheet/Spilling/2D-array whose size is (1,1) is treated as a scalar
   *   (not broadcast); only multi-cell matrices trigger broadcast
   * - For variadic args, extra args are assigned round-robin
   *   across the variadic helpArg positions
   */
  private broadcast(): any[][] | undefined {
    if (this.broadcastDisabled) {
      return undefined;
    }

    // Map each args index to its corresponding args index
    const helpIndices = resolveParamIndex(this.defs, this.args.length);

    // Determine which arg positions are broadcastable (takesMatrix: true suppresses broadcasting).
    const broadcastable: boolean[] = this.args.map((_, i) => {
      const hIdx = helpIndices[i];
      return !this.defs[hIdx]?.takesMatrix;
    });

    // Collect matrices only for broadcastable positions whose value is a multi-cell matrix
    const matrices: (any[][] | null)[] = this.args.map((arg, i) => {
      if (broadcastable[i] && isMultiCell(arg)) {
        return this.toMatrix(arg);
      }
      return null;
    });

    // If no broadcastable arg is actually a multi-cell matrix, nothing to do
    if (matrices.every((m) => m === null)) {
      return undefined;
    }

    // Collapse 1×1 matrix args (non-broadcast) to scalars for the cell-level calls
    const scalarArgs = this.args.map((arg, i) => {
      if (matrices[i] !== null) {
        return arg;
      } // will be expanded per-cell
      return this.toScalar(arg);
    });

    // Compute the max rows / cols across all matrix arguments
    let maxRows = 1;
    let maxCols = 1;
    for (const m of matrices) {
      if (m) {
        maxRows = Math.max(maxRows, m.length);
        maxCols = Math.max(
          maxCols,
          m.reduce((acc, row) => Math.max(acc, row.length), 0),
        );
      }
    }

    // Save original args so we can restore after each cell iteration
    const originalBareArgs = this.args;

    // Iterate over every (row, col) position
    const result: any[][] = [];
    for (let r = 0; r < maxRows; r++) {
      const row: any[] = [];
      for (let c = 0; c < maxCols; c++) {
        // Build the argument list for this cell position
        const cellArgs = scalarArgs.map((arg, i) => {
          const m = matrices[i];
          if (m) {
            // If the position exists in the matrix, use it; otherwise null
            return m?.[r]?.[c] ?? null;
          }
          return arg;
        });
        try {
          if (hasPendingArg(cellArgs)) {
            row.push(createPropagatedPending());
          } else {
            // Validate cell-level args
            const validatedArgs = this.validate(cellArgs);
            if (hasDeepPending(validatedArgs, this.at)) {
              row.push(createPropagatedPending());
            } else {
              row.push(this._main(...validatedArgs));
            }
          }
        } catch (e) {
          row.push(e);
        }
      }
      result.push(row);
    }

    // Restore original args
    this.args = originalBareArgs;

    return result;
  }
}

/**
 * Base class for sync functions.
 * Extend this class to create sync functions that support caching.
 */
export class BaseFunctionSync extends BaseFunction {
  protected isAsync: boolean = false;
}

/**
 * Base class for async functions.
 * Extend this class to create async functions that support caching.
 */
export class BaseFunctionAsync extends BaseFunction {
  protected isAsync: boolean = true;
}

export type FunctionMapping = { [functionName: string]: typeof BaseFunction };
