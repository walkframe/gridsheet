import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class AtanFunction extends BaseFunction {
  example = 'ATAN(1)';
  helpText = ['Returns the inverse tan of the value in radians.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'A value for the inverse tan.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ATAN is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(value: number) {
    return Math.atan(value);
  }
}
