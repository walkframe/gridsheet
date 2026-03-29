import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const description = `Returns TRUE if the value is a valid email address.`;

export class IsemailFunction extends BaseFunction {
  example = 'ISEMAIL(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to check for being a valid email address.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    if (typeof value !== 'string') {
      return false;
    }
    return EMAIL_REGEX.test(value);
  }
}
