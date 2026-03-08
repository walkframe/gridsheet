import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class NaFunction extends BaseFunction {
  example = 'NA()';
  helpText = ['Returns the error value #N/A, meaning "value not available".'];
  helpArgs: HelpArg[] = [];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 0) {
      throw new FormulaError('#N/A', 'Number of arguments for NA is incorrect.');
    }
  }

  protected main() {
    return new FormulaError('#N/A', 'N/A');
  }
}
