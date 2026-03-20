import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Table, solveTable } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the product of a series of numbers.`;

export class ProductFunction extends BaseFunction {
  example = 'PRODUCT(2,3,4)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to multiply.',
      takesMatrix: true,
      acceptedTypes: ['number', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    const spreaded: number[] = [];
    args.forEach((arg) => {
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
    return spreaded;
  }

  protected main(...values: number[]) {
    return values.reduce((a, b) => a * b);
  }
}
