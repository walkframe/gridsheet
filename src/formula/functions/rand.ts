import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';

export class RandFunction extends BaseFunction {
  example = 'RAND()';
  helpText = ['Returns a random number between 0 and 1.'];
  helpArgs = [];

  protected validate() {
    if (this.bareArgs.length !== 0) {
      throw new FormulaError('#N/A', 'Number of arguments for RAND is incorrect.');
    }
  }

  protected main() {
    return Math.random();
  }
}
