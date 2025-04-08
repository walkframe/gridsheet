import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class RounddownFunction extends BaseFunction {
  example = 'ROUNDDOWN(99.44,1)';
  helpText = ['Round down a number to the specified number of decimal places according to standard rules.'];
  helpArgs = [
    {
      name: 'value',
      description: 'A number to be rounded down.',
    },
    {
      name: 'digit',
      description: 'The number of decimal places after rounding.',
      optional: true,
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 1 && this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for ROUNDDOWN is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(value: number, digit = 0) {
    const multiplier = Math.pow(10, digit);
    return Math.floor(value * multiplier) / multiplier;
  }
}
