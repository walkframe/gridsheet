import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the logarithm of a number whose base is the specified number.`;

export class LogFunction extends BaseFunction {
  example = 'LOG(128, 2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value for the logarithm of the specified number as base.',
      acceptedTypes: ['number'],
    },
    { name: 'base', description: 'An exponent to power the base.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number, base: number) {
    if (value <= 0) {
      throw new FormulaError('NUM!', 'value must be greater than 0');
    }
    if (base <= 1) {
      throw new FormulaError('NUM!', 'base must be greater than 1');
    }
    return Math.log2(value) / Math.log2(base);
  }
}
