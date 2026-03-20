import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

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
