import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';
import { FormulaError } from '../evaluator';

export class SumFunction extends BaseFunction {
  example = 'SUM(A2:A100, 101)';
  helpText = ['Returns the sum of a series of numbers or cells.'];
  helpArgs = [
    { name: 'value1', description: 'First number or range.' },
    {
      name: 'value2',
      description: 'Additional numbers or ranges',
      optional: true,
      iterable: true,
    },
  ];

  protected validate() {
    if (this.bareArgs.length === 0) {
      throw new FormulaError('#N/A', 'One or more arguments are required.');
    }
    const spreaded: number[] = [];
    this.bareArgs.forEach((arg) => {
      if (arg instanceof Table) {
        spreaded.push(
          ...solveTable({ table: arg })
            .reduce((a, b) => a.concat(b))
            .map((v) => ensureNumber(v, { ignore: true })),
        );
        return;
      }
      spreaded.push(ensureNumber(arg, { ignore: true }));
    });
    this.bareArgs = spreaded;
  }

  protected main(...values: number[]) {
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((a, b) => a + b);
  }
}
