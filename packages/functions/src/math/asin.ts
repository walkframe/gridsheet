import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class AsinFunction extends BaseFunction {
  example = 'ASIN(1)';
  helpText = ['Returns the inverse sin of the value in radians.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'A value for the inverse sin between -1 and 1.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ASIN is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
    if (-1 > this.bareArgs[0] || this.bareArgs[0] > 1) {
      throw new FormulaError('#NUM!', 'value must be between -1 and 1');
    }
  }

  protected main(value: number) {
    return Math.asin(value);
  }
}
