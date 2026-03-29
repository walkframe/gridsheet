import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

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

  protected main(...values: any[]) {
    let product = 1;
    for (const val of values) {
      eachMatrix(
        val,
        (v: any) => {
          if (v == null || typeof v === 'string') {
            return;
          }
          product *= ensureNumber(v);
        },
        this.at,
      );
    }
    return product;
  }
}
