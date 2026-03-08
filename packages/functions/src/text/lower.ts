import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Converts all characters in a string to lowercase.`;

export class LowerFunction extends BaseFunction {
  example = 'LOWER("Hello World")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'The string to convert to lowercase.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    const t = ensureString(text);
    return t.toLowerCase();
  }
}
