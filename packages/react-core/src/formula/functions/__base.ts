import { Table } from '../../lib/table';
import type { PointType } from '../../types';
import { Expression } from '../evaluator';
import { hasPendingArg, buildAsyncCacheKey, handleAsyncResult, createPropagatedPending } from './__async_base';

export type FunctionProps = {
  args: Expression[];
  table: Table;
  origin?: PointType;
};

export class BaseFunction {
  public example = '_BASE()';
  public helpTexts = ["Function's description."];
  public helpArgs = [{ name: 'value1', description: '' }];
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

    // @ts-expect-error main is not defined in BaseFunction
    const result = this.main(...this.bareArgs);

    // If main() returns a Promise (async function), handle it via the async cache
    if (result instanceof Promise) {
      const key = buildAsyncCacheKey(this.constructor.name, this.bareArgs);
      return handleAsyncResult(result, this.table.wire, key);
    }

    return result;
  }
}

export type FunctionMapping = { [functionName: string]: typeof BaseFunction };
