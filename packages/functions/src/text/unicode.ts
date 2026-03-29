import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { ensureString } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the Unicode code point (decimal) of the first character of the text.
Numbers passed as argument are treated as strings.`;

export class UnicodeFunction extends BaseFunction {
  example = 'UNICODE("A")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'The text whose first character Unicode value is returned.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    text = ensureString(text);
    if (text.length === 0) {
      throw new FormulaError('#VALUE!', 'UNICODE: text must not be empty.');
    }
    const codePoint = text.codePointAt(0);
    if (codePoint === undefined) {
      throw new FormulaError('#VALUE!', 'UNICODE: unable to determine Unicode value.');
    }
    return codePoint;
  }
}
