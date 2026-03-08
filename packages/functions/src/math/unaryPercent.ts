import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class UnaryPercentFunction extends BaseFunction {
  example = 'UNARY_PERCENT(50)';
  helpText = ['Returns a value interpreted as a percentage, i.e. divides the number by 100.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'A number to be divided by 100.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for UNARY_PERCENT is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(value: number) {
    return value / 100;
  }
}
