import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class CleanFunction extends BaseFunction {
  example = 'CLEAN(A1)';
  helpText = ['Removes all non-printable ASCII characters (code points 0–31) from text.'];
  helpArgs: HelpArg[] = [
    { name: 'text', description: 'The text from which to remove non-printable characters.', type: ['string'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for CLEAN is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
    // Remove ASCII control characters (U+0000–U+001F)

    return text.replace(/[\x00-\x1F]/g, '');
  }
}
