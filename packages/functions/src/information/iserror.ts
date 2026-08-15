import { BaseFunction, FormulaError } from '@gridsheet/web';
import type { FunctionArgumentDefinition, FunctionProps } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

const description = `Returns TRUE if the value is any error value.`;

export class IserrorFunction extends BaseFunction {
  example = 'ISERROR(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to check for an error.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    return FormulaError.is(value) || value instanceof Error;
  }
}
