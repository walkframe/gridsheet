import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the factorial of a number.`;

export class FactFunction extends BaseFunction {
  example = 'FACT(5)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A non-negative integer whose factorial will be returned.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(n: number) {
    if (n < 0) {
      throw new FormulaError('#NUM!', 'FACT requires a non-negative integer.');
    }
    let result = 1;
    for (let i = 2; i <= Math.floor(n); i++) {
      result *= i;
    }
    return result;
  }
}
