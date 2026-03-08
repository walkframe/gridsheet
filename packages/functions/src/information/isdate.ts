import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IsdateFunction extends BaseFunction {
  example = 'ISDATE(A1)';
  helpText = ['Returns TRUE if the value is a date.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to check for being a date.',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISDATE is incorrect.');
    }
  }

  protected main(value: any) {
    return value instanceof Date && !isNaN(value.getTime());
  }
}
