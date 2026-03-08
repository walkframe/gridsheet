import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class NFunction extends BaseFunction {
  example = 'N(A1)';
  helpText = ['Returns the argument provided as a number.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to convert to a number.',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for N is incorrect.');
    }
  }

  protected main(value: any) {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    try {
      return ensureNumber(value);
    } catch {
      return 0;
    }
  }
}
