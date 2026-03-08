import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IsevenFunction extends BaseFunction {
  example = 'ISEVEN(4)';
  helpText = ['Returns TRUE if the value is even.'];
  helpArgs: HelpArg[] = [{ name: 'value', description: 'The value to check for being even.', type: ['number'] }];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISEVEN is incorrect.');
    }
    this.bareArgs[0] = ensureNumber(this.bareArgs[0]);
  }

  protected main(value: number) {
    return Math.floor(Math.abs(value)) % 2 === 0;
  }
}
