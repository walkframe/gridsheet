import { Pending } from '../../constants';
import type { Wire } from '../../lib/hub';
import type { CellType, PointType } from '../../types';

/**
 * Lightweight error class used inside async formula error handling.
 * Mirrors FormulaError's shape so the renderer can display it identically.
 * We define it here rather than importing FormulaError to keep the
 * dependency graph clean.
 */
export class AsyncFormulaError {
  public code: string;
  public message: string;
  public error?: Error;
  constructor(code: string, message: string, error?: Error) {
    this.code = code;
    this.message = message;
    this.error = error;
  }
}

/** Returns true if any element of `args` is a Pending sentinel. */
export const hasPendingArg = (args: any[]): boolean => {
  return args.some((v) => v instanceof Pending);
};

/** Duck-type check for Table instances (avoids importing Table to prevent circular deps). */
const isTable = (v: any): boolean => v != null && typeof v === 'object' && 'sheetId' in v && 'wire' in v;

/**
 * Build a cache key from function name + serialised arguments.
 * Used to detect when a formula's inputs have changed so the cache can be invalidated.
 */
export const buildAsyncCacheKey = (funcName: string, bareArgs: any[]): string => {
  const argsKey = JSON.stringify(bareArgs, (_key, value) => {
    if (isTable(value)) {
      return `__table__${value.sheetId}`;
    }
    if (value instanceof Pending) {
      return '__pending__';
    }
    if (value === undefined) {
      return '__undefined__';
    }
    return value;
  });
  return `${funcName}:${argsKey}`;
};

/**
 * Handle an async (Promise) result returned by BaseFunction.main().
 *
 * Cache is stored per-cell in cell.system.asyncCache.
 * In-flight tracking uses Wire.asyncPending (keyed by cell ID).
 *
 * Flow:
 * 1. If cell has asyncCache and the key matches (inputs unchanged) and not expired → return cached value
 * 2. If there is already an in-flight promise for this cell → return its Pending
 * 3. Otherwise start the async work, return a new Pending, and on completion
 *    write the result into cell.system.asyncCache and trigger a re-render.
 *
 * @param ttlMSec - Cache time-to-live in **milliseconds**. undefined = never expires.
 */
export const handleAsyncResult = (
  promise: Promise<any>,
  table: { wire: Wire; getId: (p: PointType) => string },
  origin: PointType,
  key: string,
  ttlMSec?: number,
): any => {
  const cellId = table.getId(origin);
  const wire = table.wire;
  const cell: CellType | undefined = wire.data[cellId];

  // Check for a cached result from a previous async run
  if (cell?.system?.asyncCache != null) {
    const ac = cell.system.asyncCache;
    if (ac.key === key) {
      // Check expiry
      if (ac.expireTime == null || Date.now() < ac.expireTime) {
        return ac.value;
      }
      // Expired — clear and re-fetch below
      cell.system.asyncCache = undefined;
    } else {
      // Key changed (inputs changed) — invalidate
      cell.system.asyncCache = undefined;
    }
  }

  // Check if there is already a pending promise for this cell
  if (wire.asyncPending.has(cellId)) {
    return wire.asyncPending.get(cellId)!;
  }

  // Compute expireTime from ttl (ms)
  const expireTime = ttlMSec != null ? Date.now() + ttlMSec : undefined;

  // Start the async computation
  const pending = new Pending(promise);
  wire.asyncPending.set(cellId, pending);

  promise
    .then((result: any) => {
      const c = wire.data[cellId];
      if (c?.system) {
        c.system.asyncCache = { value: result, key, expireTime };
      }
    })
    .catch((error: any) => {
      const errValue = new AsyncFormulaError('#ASYNC!', error?.message ?? String(error), error);
      const c = wire.data[cellId];
      if (c?.system) {
        c.system.asyncCache = { value: errValue, key, expireTime };
      }
    })
    .finally(() => {
      wire.asyncPending.delete(cellId);
      // Clear solvedCaches so dependent formulas re-evaluate
      wire.solvedCaches.clear();
      // Trigger re-render of all sheets
      wire.transmit();
    });

  return pending;
};

/**
 * Create a Pending sentinel that resolves immediately.
 * Used when an argument is already pending — the result is propagated.
 */
export const createPropagatedPending = (): Pending => {
  return new Pending(Promise.resolve());
};
