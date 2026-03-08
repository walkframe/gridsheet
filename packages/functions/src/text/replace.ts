import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString, ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ReplaceFunction extends BaseFunction {
  example = 'REPLACE("Hello World", 7, 5, "Excel")';
  helpText = ['Replaces part of a text string with a different text string.', 'position is 1-based.'];
  helpArgs: HelpArg[] = [
    { name: 'text', description: 'The original text string.', type: ['string'] },
    { name: 'position', description: 'The 1-based position at which to start replacing.', type: ['number'] },
    { name: 'length', description: 'The number of characters to replace.', type: ['number'] },
    { name: 'new_text', description: 'The replacement text.', type: ['string'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 4) {
      throw new FormulaError('#N/A', 'Number of arguments for REPLACE is incorrect.');
    }
    this.bareArgs[0] = ensureString(this.bareArgs[0]);
    this.bareArgs[1] = ensureNumber(this.bareArgs[1]);
    this.bareArgs[2] = ensureNumber(this.bareArgs[2]);
    this.bareArgs[3] = ensureString(this.bareArgs[3]);
  }

  protected main(text: string, position: number, length: number, newText: string) {
    // Convert to array of Unicode code points to handle surrogate pairs correctly
    const chars = [...text];
    const start = Math.max(0, position - 1);
    chars.splice(start, length, newText);
    return chars.join('');
  }
}
