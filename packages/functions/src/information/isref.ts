import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IsrefFunction extends BaseFunction {
  example = 'ISREF(A1)';
  helpText = ['Returns TRUE if the value is a valid cell reference.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to check for being a cell reference.',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISREF is incorrect.');
    }
  }

  protected main(value: any) {
    return value instanceof Table;
  }
}
