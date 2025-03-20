import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class AtanFunction extends BaseFunction {
  example = 'ATAN(1)';
  helpText = ['Returns the inverse tan of the value in radians.'];
  helpArgs = [
    {
      name: 'value',
      description: 'A value for the inverse tan.',
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ATAN is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(value: number) {
    return Math.atan(value);
  }
}
