import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns TRUE if the value is a date.`;

export class IsdateFunction extends BaseFunction {
  example = 'ISDATE(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to check for being a date.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    return value instanceof Date && !isNaN(value.getTime());
  }
}
