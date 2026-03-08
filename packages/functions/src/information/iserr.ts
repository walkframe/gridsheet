import { BaseFunction, FormulaError } from '@gridsheet/react-core';
import type { FunctionArgumentDefinition, FunctionProps } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';

const description = `Returns TRUE if the value is any error other than #N/A.`;

export class IserrFunction extends BaseFunction {
  example = 'ISERR(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to check for a non-#N/A error.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    if (value instanceof Error) {
      return true;
    }
    return FormulaError.is(value) && value.code !== '#N/A';
  }
}
