import { Table } from '../../lib/table';
import type { PointType } from '../../types';
import { Expression } from '../evaluator';
import {
  hasPendingArg,
  buildAsyncCacheKey,
  awaitAndSave,
  createPropagatedPending,
  getAsyncCache,
  asyncCacheMiss,
} from './__async';

export type FunctionProps = {
  args: Expression[];
  table: Table;
  origin?: PointType;
};

export type HelpArg = {
  name: string;
  description: string;
  optional?: boolean;
  iterable?: boolean;
  type?: ('number' | 'string' | 'boolean' | 'date' | 'time' | 'range' | 'reference' | 'any')[];
};

export const conditionArg: HelpArg = {
  name: 'condition',
  description:
    'The condition to evaluate. Use "=" for equal, "<" for less than, ">" for greater than, "<=" for less than or equal, ">=" for greater than or equal, "<>" for not equal.',
  type: ['string'],
};

export class BaseFunction {
  public example = '_BASE()';
  public helpTexts = ["Function's description."];
  public helpArgs: HelpArg[] = [];
  /** Indicates if this function is async. Override in subclass or use BaseFunctionAsync. */
  protected isAsync: boolean = false;
  /** Cache TTL in milliseconds. Override in subclass to set expiry. undefined = never expires. */
  protected ttlMilliseconds?: number;
  /** Hash precision for cache key generation. Higher values reduce collision risk. Default: 1 */
  protected hashPrecision: number = 1;
  /** If true, reuse the same in-flight promise for matching cache keys across different cells. */
  protected useInflight: boolean = true;
  protected bareArgs: any[];
  protected table: Table;
  protected origin?: PointType;

  constructor({ args, table, origin }: FunctionProps) {
    this.bareArgs = args.map((a) => a.evaluate({ table }));
    this.table = table;
    this.origin = origin;
  }
  protected validate() {}

  public call() {
    this.validate();

    // If any argument is still pending (before or after validate), propagate the pending state
    if (hasPendingArg(this.bareArgs)) {
      return createPropagatedPending();
    }

    // For async functions, build cache key and check cache before execution
    if (this.isAsync) {
      const key = buildAsyncCacheKey(this.constructor.name, this.bareArgs, this.hashPrecision);
      const cached = getAsyncCache(this.table, this.origin!, key, this.useInflight);
      if (cached !== asyncCacheMiss) {
        return cached;
      }

      // @ts-expect-error main is not defined in BaseFunction
      const promise = this.main(...this.bareArgs);
      return awaitAndSave(promise, this.table, this.origin!, key, this.ttlMilliseconds, this.useInflight);
    }

    // For sync functions, just call and return
    // @ts-expect-error main is not defined in BaseFunction
    return this.main(...this.bareArgs);
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
