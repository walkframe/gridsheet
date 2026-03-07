import { FormulaError } from '../evaluator';
import { BaseFunction, HelpArg } from './__base';

export class PiFunction extends BaseFunction {
  example = 'PI()';
  helpText = ['Returns the value of pi.'];
  helpArgs: HelpArg[] = [];

  protected validate() {
    if (this.bareArgs.length !== 0) {
      throw new FormulaError('#N/A', 'Number of arguments for PI is incorrect.');
    }
  }

  protected main() {
    return Math.PI;
  }
}
