import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class ExpFunction extends BaseFunction {
  example = 'EXP(2)';
  helpText = ['Returns the power of a number whose base is the Euler number e.'];
  helpArgs = [
    {
      name: 'exponent',
      description: 'It is an exponent of power with e as the base.',
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for EXP is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(exponent: number) {
    return Math.exp(exponent);
  }
}
