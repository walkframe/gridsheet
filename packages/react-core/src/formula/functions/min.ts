import { FormulaError } from '../evaluator';
import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { BaseFunction, FunctionCategory, HelpArg } from './__base';
import { ensureNumber } from './__utils';

export class MinFunction extends BaseFunction {
  example = 'MIN(A2:A100, 101)';
  helpText = ['Returns the min in a series of numbers or cells.'];
  helpArgs: HelpArg[] = [
    { name: 'value1', description: 'First number or range.', type: ['number'] },
    {
      name: 'value2',
      description: 'Additional numbers or ranges',
      type: ['number'],
      optional: true,
      iterable: true,
    },
  ];
  category: FunctionCategory = 'statistics';

  protected validate() {
    if (this.bareArgs.length === 0) {
      throw new FormulaError('#N/A', 'Number of arguments must be greater than 0.');
    }
    const spreaded: number[] = [];
    this.bareArgs.map((arg) => {
      if (arg instanceof Table) {
        spreaded.push(
          ...solveTable({ table: arg })
            .reduce((a, b) => a.concat(b))
            .filter((v: any) => typeof v === 'number'),
        );
        return;
      }
      spreaded.push(ensureNumber(arg));
    });
    this.bareArgs = spreaded;
  }

  protected main(...values: number[]) {
    if (values.length === 0) {
      return 0;
    }
    return Math.min(...values);
  }
}
