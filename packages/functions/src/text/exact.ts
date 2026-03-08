import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ExactFunction extends BaseFunction {
  example = 'EXACT("山", A3)';
  helpText = ['Tests whether two strings are exactly the same (case-sensitive). Returns TRUE or FALSE.'];
  helpArgs: HelpArg[] = [
    { name: 'text1', description: 'First string to compare.', type: ['string'] },
    { name: 'text2', description: 'Second string to compare.', type: ['string'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for EXACT is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureString(arg));
  }

  protected main(text1: string, text2: string) {
    return text1 === text2;
  }
}
