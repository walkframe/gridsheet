import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the logarithm of e`;

export class LnFunction extends BaseFunction {
  example = 'LN(100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value for the logarithm of e',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    if (value <= 0) {
      throw new FormulaError('NUM!', 'value must be greater than 0');
    }
    return Math.log(value);
  }
}
