import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class CharFunction extends BaseFunction {
  example = 'CHAR(65)';
  helpText = ['Converts a number to a character according to the current Unicode table.'];
  helpArgs: HelpArg[] = [
    { name: 'number', description: 'The Unicode code point to convert to a character.', type: ['number'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for CHAR is incorrect.');
    }
    this.bareArgs = [ensureNumber(this.bareArgs[0])];
  }

  protected main(number: number) {
    const codePoint = Math.trunc(number);
    if (codePoint < 1 || codePoint > 0x10ffff) {
      throw new FormulaError('#VALUE!', `CHAR: ${number} is not a valid Unicode code point.`);
    }
    return String.fromCodePoint(codePoint);
  }
}
