import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class IsemailFunction extends BaseFunction {
  example = 'ISEMAIL(A1)';
  helpText = ['Returns TRUE if the value is a valid email address.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to check for being a valid email address.',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISEMAIL is incorrect.');
    }
  }

  protected main(value: any) {
    if (typeof value !== 'string') {
      return false;
    }
    return EMAIL_REGEX.test(value);
  }
}
