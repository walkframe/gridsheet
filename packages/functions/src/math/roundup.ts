import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';

export class RoundupFunction extends BaseFunction {
  example = 'ROUNDUP(99.44,1)';
  helpText = ['Round up a number to the specified number of decimal places according to standard rules.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'A number to be rounded up.',
      type: ['number'],
    },
    {
      name: 'digit',
      description: 'The number of decimal places after rounding.',
      type: ['number'],
      optional: true,
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 1 && this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for ROUNDUP is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(value: number, digit = 0) {
    const multiplier = Math.pow(10, digit);
    return Math.ceil(value * multiplier) / multiplier;
  }
}
