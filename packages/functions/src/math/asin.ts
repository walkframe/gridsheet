import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the inverse sin of the value in radians.`;

export class AsinFunction extends BaseFunction {
  example = 'ASIN(1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A value for the inverse sin between -1 and 1.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    if (-1 > value || value > 1) {
      throw new FormulaError('#NUM!', 'value must be between -1 and 1');
    }
    return Math.asin(value);
  }
}
