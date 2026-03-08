import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IslogicalFunction extends BaseFunction {
  example = 'ISLOGICAL(TRUE)';
  helpText = ['Returns TRUE if the value is TRUE or FALSE.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to check for being logical (TRUE or FALSE).',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISLOGICAL is incorrect.');
    }
  }

  protected main(value: any) {
    return typeof value === 'boolean';
  }
}
