import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table, solveTable } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ProductFunction extends BaseFunction {
  example = 'PRODUCT(2,3,4)';
  helpText = ['Returns the product of a series of numbers.'];
  helpArgs: HelpArg[] = [
    { name: 'value1', description: 'First number or range.', type: ['number', 'range'] },
    {
      name: 'value2',
      description: 'Additional numbers or ranges',
      type: ['number', 'range'],
      optional: true,
      iterable: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    const spreaded: number[] = [];
    this.bareArgs.forEach((arg) => {
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
    return values.reduce((a, b) => a * b);
  }
}
