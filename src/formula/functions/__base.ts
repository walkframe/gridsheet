import { Table } from '../../lib/table';
import { Expression } from '../evaluator';

export type FunctionProps = {
  args: Expression[];
  table: Table;
};

export class BaseFunction {
  public example = '_BASE()';
  public helpTexts = ["Function's description."];
  public helpArgs = [{ name: 'value1', description: '' }];
  protected bareArgs: any[];
  protected table: Table;

  constructor({ args, table }: FunctionProps) {
    this.bareArgs = args.map((a) => a.evaluate({ table }));
    this.table = table;
  }
  protected validate() {}

  public call() {
    this.validate();

    // @ts-expect-error main is not defined in BaseFunction
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.main(...this.bareArgs);
  }
}

export type FunctionMapping = { [functionName: string]: typeof BaseFunction };
