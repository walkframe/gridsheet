import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class UnicharFunction extends BaseFunction {
  example = 'UNICHAR(9731)';
  helpText = ['Returns the Unicode character corresponding to the given numeric code point.'];
  helpArgs: HelpArg[] = [
    { name: 'number', description: 'The Unicode code point (decimal) to convert.', type: ['number'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for UNICHAR is incorrect.');
    }
    this.bareArgs = [ensureNumber(this.bareArgs[0])];
  }

  protected main(number: number) {
    const codePoint = Math.trunc(number);
    if (codePoint < 1 || codePoint > 0x10ffff) {
      throw new FormulaError('#VALUE!', `UNICHAR: ${number} is not a valid Unicode code point.`);
    }
    return String.fromCodePoint(codePoint);
  }
}
