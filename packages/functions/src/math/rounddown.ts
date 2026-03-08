import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Round down a number to the specified number of decimal places according to standard rules.`;

export class RounddownFunction extends BaseFunction {
  example = 'ROUNDDOWN(99.44,1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A number to be rounded down.',
      acceptedTypes: ['number'],
    },
    {
      name: 'digit',
      description: 'The number of decimal places after rounding.',
      acceptedTypes: ['number'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number, digit = 0) {
    const multiplier = Math.pow(10, digit);
    return Math.floor(value * multiplier) / multiplier;
  }
}
