import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ExpFunction extends BaseFunction {
  example = 'EXP(2)';
  helpText = ['Returns the power of a number whose base is the Euler number e.'];
  helpArgs: HelpArg[] = [
    {
      name: 'exponent',
      description: 'It is an exponent of power with e as the base.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for EXP is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(exponent: number) {
    return Math.exp(exponent);
  }
}
