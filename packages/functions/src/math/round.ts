import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';
import { roundDecimal } from './decimal';

const description = `Round a number to the specified number of decimal places according to standard rules.`;

export class RoundFunction extends BaseFunction {
  example = 'ROUND(99.44,1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A number to be rounded.',
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
    // Half rounds away from zero (Excel/Sheets), unlike Math.round which rounds half toward +Infinity.
    return roundDecimal(value, digit, (n) => Math.sign(n) * Math.round(Math.abs(n)));
  }
}
