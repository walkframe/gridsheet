import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the number of bytes in the length of the string.`;

export class LenbFunction extends BaseFunction {
  example = 'LENB(A2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'A text to be returned the length of the bytes.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    text = String(text);
    return encodeURIComponent(text).replace(/%../g, 'x').length;
  }
}
