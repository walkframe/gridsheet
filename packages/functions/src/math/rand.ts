import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class RandFunction extends BaseFunction {
  example = 'RAND()';
  helpText = ['Returns a random number between 0 and 1.'];
  helpArgs: HelpArg[] = [];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 0) {
      throw new FormulaError('#N/A', 'Number of arguments for RAND is incorrect.');
    }
  }

  protected main() {
    return Math.random();
  }
}
