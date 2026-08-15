import { FormulaError } from '@gridsheet/web';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import { ensureString } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

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
