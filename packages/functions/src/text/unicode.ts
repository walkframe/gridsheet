import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class UnicodeFunction extends BaseFunction {
  example = 'UNICODE("A")';
  helpText = [
    'Returns the Unicode code point (decimal) of the first character of the text.',
    'Numbers passed as argument are treated as strings.',
  ];
  helpArgs: HelpArg[] = [
    { name: 'text', description: 'The text whose first character Unicode value is returned.', type: ['string'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for UNICODE is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
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
