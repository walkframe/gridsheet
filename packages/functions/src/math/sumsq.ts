import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the sum of the squares of a series of numbers or cells.`;

export class SumsqFunction extends BaseFunction {
  example = 'SUMSQ(A1:A10, 3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to square and sum.',
      takesMatrix: true,
      acceptedTypes: ['number', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected main(...values: any[]) {
    let sum = 0;
    for (const val of values) {
      eachMatrix(
        val,
        (v: any) => {
          const n = ensureNumber(v, { ignore: true });
          sum += n * n;
        },
        this.at,
      );
    }
    return sum;
  }
}
