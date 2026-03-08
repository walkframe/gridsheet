import { FormulaError } from '../evaluator';
import { BaseFunction, FunctionCategory, HelpArg } from './__base';

export class NowFunction extends BaseFunction {
  example = 'NOW()';
  helpText = ['Returns a serial value corresponding to the current date and time.'];
  helpArgs: HelpArg[] = [];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 0) {
      throw new FormulaError('#N/A', 'Number of arguments for NOW is incorrect.');
    }
  }

  protected main() {
    return new Date();
  }
}
