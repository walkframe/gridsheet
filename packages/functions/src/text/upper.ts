import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class UpperFunction extends BaseFunction {
  example = 'UPPER("hello world")';
  helpText = ['Converts all characters in a string to uppercase.'];
  helpArgs: HelpArg[] = [{ name: 'text', description: 'The string to convert to uppercase.', type: ['string'] }];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for UPPER is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
    return text.toUpperCase();
  }
}
