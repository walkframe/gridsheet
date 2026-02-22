import { Table } from '../../lib/table';
import type { PointType } from '../../types';
import { Expression } from '../evaluator';
import {
  hasPendingArg,
  buildAsyncCacheKey,
  getOrSaveAsyncCache,
  createPropagatedPending,
  getAsyncCache,
  asyncCacheMiss,
} from './__async';

export type FunctionProps = {
  args: Expression[];
  table: Table;
  origin?: PointType;
};

export class BaseFunction {
  public example = '_BASE()';
  public helpTexts = ["Function's description."];
  public helpArgs = [{ name: 'value1', description: '' }];
  /** Cache TTL in milliseconds. Override in subclass to set expiry. undefined = never expires. */
  protected ttlMilliseconds?: number;
  /** Hash precision for cache key generation. Higher values reduce collision risk. Default: 1 */
  protected hashPrecision: number = 1;
  protected bareArgs: any[];
  protected table: Table;
  protected origin?: PointType;

  constructor({ args, table, origin }: FunctionProps) {
    this.bareArgs = args.map((a) => a.evaluate({ table }));
    this.table = table;
    this.origin = origin;
  }
  protected validate() {}

  private get isMainAsync(): boolean {
    const mainDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), 'main');
    return mainDescriptor?.value?.constructor?.name === 'AsyncFunction';
  }

  public call() {
    this.validate();

    // If any argument is still pending (before or after validate), propagate the pending state
    if (hasPendingArg(this.bareArgs)) {
      return createPropagatedPending();
    }

    // For async functions, build cache key and check cache before execution
    if (this.isMainAsync) {
      const key = buildAsyncCacheKey(this.constructor.name, this.bareArgs, this.hashPrecision);
      const cachedResult = getAsyncCache(this.table, this.origin!, key);
      if (cachedResult !== asyncCacheMiss) {
        return cachedResult;
      }

      // @ts-expect-error main is not defined in BaseFunction
      const result = this.main(...this.bareArgs);
      return getOrSaveAsyncCache(result, this.table, this.origin!, key, this.ttlMilliseconds);
    }

    // For sync functions, just call and return
    // @ts-expect-error main is not defined in BaseFunction
    return this.main(...this.bareArgs);
  }
}

export type FunctionMapping = { [functionName: string]: typeof BaseFunction };
