import { FormulaError } from '@gridsheet/engine';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { ensureNumber } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Converts a number to a character according to the current Unicode sheet.`;

export class CharFunction extends BaseFunction {
  example = 'CHAR(65)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'number', description: 'The Unicode code point to convert to a character.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'text';

  protected main(number: number) {
    const codePoint = Math.trunc(number);
    if (codePoint < 1 || codePoint > 0x10ffff) {
      throw new FormulaError('#VALUE!', `CHAR: ${number} is not a valid Unicode code point.`);
    }
    return String.fromCodePoint(codePoint);
  }
}
