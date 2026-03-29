import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { ensureString } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Capitalizes the first letter of each word in a string.`;

export class ProperFunction extends BaseFunction {
  example = 'PROPER("hello world")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'The string to convert to title case.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    text = ensureString(text);
    return text.replace(/\p{L}+/gu, (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }
}
