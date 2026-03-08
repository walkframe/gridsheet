import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ProperFunction extends BaseFunction {
  example = 'PROPER("hello world")';
  helpText = ['Capitalizes the first letter of each word in a string.'];
  helpArgs: HelpArg[] = [{ name: 'text', description: 'The string to convert to title case.', type: ['string'] }];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for PROPER is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
    return text.replace(/\p{L}+/gu, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }
}
