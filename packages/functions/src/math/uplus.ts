import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class UplusFunction extends BaseFunction {
  example = 'UPLUS(4)';
  helpText = ['Returns the number with its sign unchanged (unary plus).'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'A number to return as-is.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for UPLUS is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(value: number) {
    return value;
  }
}
