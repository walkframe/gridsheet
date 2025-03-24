import { Table } from '../../lib/table';
import type { PointType } from '../../types';
import { Expression } from '../evaluator';

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

    // @ts-expect-error main is not defined in BaseFunction

    return this.main(...this.bareArgs);
  }
}

export type FunctionMapping = { [functionName: string]: typeof BaseFunction };
