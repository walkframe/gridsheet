import { BaseFunction, FormulaError } from '@gridsheet/core';
import { type FunctionArgumentDefinition } from '@gridsheet/core';

const description = `Returns the first argument if it is not a #N/A error, otherwise returns the second argument.`;

export class IfnaFunction extends BaseFunction {
  static __name = 'IFNA';
  example = 'IFNA(A1, "N/A error occurred")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to return if it is not a #N/A error.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
    {
      name: 'value_if_na',
      description: 'The value to return if the first argument is a #N/A error.',
      optional: true,
      acceptedTypes: ['any'],
    },
  ];

  category = 'logical' as const;

  protected main(value: any, valueIfNa?: any) {
    if (FormulaError.is(value) && value.code === '#N/A') {
      return valueIfNa;
    }
    return value;
  }
}
