import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the concatenation of the values.`;

export class ConcatenateFunction extends BaseFunction {
  example = 'CONCATENATE("Hello", "World")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Values to concatenate.',
      acceptedTypes: ['string', 'number', 'boolean'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'text';

  protected main(...values: any[]) {
    return values.flat().map(String).join('');
  }
}
