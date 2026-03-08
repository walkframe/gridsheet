import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class LenbFunction extends BaseFunction {
  example = 'LENB(A2)';
  helpText = ['Returns the number of bytes in the length of the string.'];
  helpArgs: HelpArg[] = [
    {
      name: 'text',
      description: 'A text to be returned the length of the bytes.',
      type: ['string'],
    },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for LENB is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
    return encodeURIComponent(text).replace(/%../g, 'x').length;
  }
}
