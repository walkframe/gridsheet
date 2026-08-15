import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import { ensureString } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

const description = `Converts all characters in a string to uppercase.`;

export class UpperFunction extends BaseFunction {
  example = 'UPPER("hello world")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'The string to convert to uppercase.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    const t = ensureString(text);
    return t.toUpperCase();
  }
}
