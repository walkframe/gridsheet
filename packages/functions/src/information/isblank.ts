import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IsblankFunction extends BaseFunction {
  example = 'ISBLANK(A1)';
  helpText = ['Returns TRUE if the referenced cell is empty.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'A reference to a cell to check for emptiness.',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISBLANK is incorrect.');
    }
  }

  protected main(value: any) {
    return value === null || value === undefined || value === '';
  }
}
