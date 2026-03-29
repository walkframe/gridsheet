import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { ensureString } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Removes all non-printable ASCII characters (code points 0–31) from text.`;

export class CleanFunction extends BaseFunction {
  example = 'CLEAN(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'The text from which to remove non-printable characters.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    text = String(text);
    // Remove ASCII control characters (U+0000–U+001F)

    return text.replace(/[\x00-\x1F]/g, '');
  }
}
