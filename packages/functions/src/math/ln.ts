import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class LnFunction extends BaseFunction {
  example = 'LN(100)';
  helpText = ['Returns the logarithm of e'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value for the logarithm of e',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for LN is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
    if (this.bareArgs[0] <= 0) {
      throw new FormulaError('NUM!', 'value must be greater than 0');
    }
  }

  protected main(value: number) {
    return Math.log(value);
  }
}
