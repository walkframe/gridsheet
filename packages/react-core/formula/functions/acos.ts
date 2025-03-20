import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class AcosFunction extends BaseFunction {
  example = 'ACOS(0)';
  helpText = ['Returns the inverse cos of the value in radians.'];
  helpArgs = [
    {
      name: 'value',
      description: 'A value for the inverse cos between -1 and 1.',
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ACOS is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
    if (-1 > this.bareArgs[0] || this.bareArgs[0] > 1) {
      throw new FormulaError('#NUM!', 'value must be between -1 and 1');
    }
  }

  protected main(value: number) {
    return Math.acos(value);
  }
}
