import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table, solveTable, ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class SumsqFunction extends BaseFunction {
  example = 'SUMSQ(A1:A10, 3)';
  helpText = ['Returns the sum of the squares of a series of numbers or cells.'];
  helpArgs: HelpArg[] = [
    { name: 'value1', description: 'First number or range.', type: ['number', 'range'] },
    {
      name: 'value2',
      description: 'Additional numbers or ranges.',
      type: ['number', 'range'],
      optional: true,
      iterable: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    const spread: number[] = [];
    for (const arg of this.bareArgs) {
      if (arg instanceof Table) {
        solveTable({ table: arg })
          .flat()
          .forEach((v) => {
            const n = ensureNumber(v, { ignore: true });
            spread.push(n);
          });
      } else {
        spread.push(ensureNumber(arg));
      }
    }
    this.bareArgs = spread;
  }

  protected main(...values: number[]) {
    return values.reduce((acc, v) => acc + v * v, 0);
  }
}
