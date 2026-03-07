import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';

export class Log10Function extends BaseFunction {
  example = 'LOG10(100)';
  helpText = ['Returns the logarithm of 10'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value for the logarithm of 10',
      type: ['number'],
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for LOG10 is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
    if (this.bareArgs[0] <= 0) {
      throw new FormulaError('NUM!', 'value must be greater than 0');
    }
  }

  protected main(value: number) {
    return Math.log10(value);
  }
}
