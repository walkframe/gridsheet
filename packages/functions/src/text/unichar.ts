import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the Unicode character corresponding to the given numeric code point.`;

export class UnicharFunction extends BaseFunction {
  example = 'UNICHAR(127843)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'number', description: 'The Unicode code point (decimal) to convert.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'text';

  protected main(number: number) {
    const codePoint = Math.trunc(number);
    if (codePoint < 1 || codePoint > 0x10ffff) {
      throw new FormulaError('#VALUE!', `UNICHAR: ${number} is not a valid Unicode code point.`);
    }
    return String.fromCodePoint(codePoint);
  }
}
