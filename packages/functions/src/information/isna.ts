import { BaseFunction, FormulaError } from '@gridsheet/react-core';
import type { FunctionArgumentDefinition, FunctionProps } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { Sheet } from '@gridsheet/react-core';

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
