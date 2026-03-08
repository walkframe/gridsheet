import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class SignFunction extends BaseFunction {
  example = 'SIGN(-3)';
  helpText = ['Returns -1 if the value is negative, 1 if positive, and 0 if zero.'];
  helpArgs: HelpArg[] = [{ name: 'value', description: 'The number to check the sign of.', type: ['number'] }];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for SIGN is incorrect.');
    }
    this.bareArgs[0] = ensureNumber(this.bareArgs[0]);
  }

  protected main(value: number) {
    if (value > 0) {
      return 1;
    }
    if (value < 0) {
      return -1;
    }
    return 0;
  }
}
