import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns TRUE if the value is TRUE or FALSE.`;

export class IslogicalFunction extends BaseFunction {
  example = 'ISLOGICAL(TRUE)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to check for being logical (TRUE or FALSE).',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    return typeof value === 'boolean';
  }
}
