import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IsnontextFunction extends BaseFunction {
  example = 'ISNONTEXT(A1)';
  helpText = ['Returns TRUE if the value is not a text string.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to check for being non-text.',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISNONTEXT is incorrect.');
    }
  }

  protected main(value: any) {
    return typeof value !== 'string';
  }
}
