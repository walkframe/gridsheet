import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { ensureString } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Removes leading and trailing spaces from a string.`;

export class TrimFunction extends BaseFunction {
  example = 'TRIM("  Hello World  ")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'The string from which to remove leading and trailing spaces.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    const t = ensureString(text);
    return t.trim();
  }
}
