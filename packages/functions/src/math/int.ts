import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IntFunction extends BaseFunction {
  example = 'INT(8.9)';
  helpText = ['Rounds a number down to the nearest integer that is less than or equal to it.'];
  helpArgs: HelpArg[] = [
    { name: 'value', description: 'The value to round down to the nearest integer.', type: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for INT is incorrect.');
    }
    this.bareArgs[0] = ensureNumber(this.bareArgs[0]);
  }

  protected main(value: number) {
    return Math.floor(value);
  }
}
