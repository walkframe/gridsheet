import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class TrimFunction extends BaseFunction {
  example = 'TRIM("  Hello World  ")';
  helpText = ['Removes leading and trailing spaces from a string.'];
  helpArgs: HelpArg[] = [
    { name: 'text', description: 'The string from which to remove leading and trailing spaces.', type: ['string'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for TRIM is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
    return text.trim();
  }
}
