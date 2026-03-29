import { BaseFunction, FormulaError } from '@gridsheet/core';
import type { FunctionArgumentDefinition, FunctionProps } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';
import { Sheet } from '@gridsheet/core';

const description = `Returns TRUE if the value is the #N/A error value.`;

export class IsnaFunction extends BaseFunction {
  example = 'ISNA(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to check for the #N/A error.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    return FormulaError.is(value) && value.code === '#N/A';
  }
}
