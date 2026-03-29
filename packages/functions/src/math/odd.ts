import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Rounds a number up to the nearest odd integer.`;

export class OddFunction extends BaseFunction {
  example = 'ODD(2.3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'The value to round up to the nearest odd integer.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    if (value === 0) {
      return 1;
    }
    const sign = value > 0 ? 1 : -1;
    let n = Math.ceil(Math.abs(value));
    if (n % 2 === 0) {
      n++;
    }
    return sign * n;
  }
}
