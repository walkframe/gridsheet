import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString, ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ReptFunction extends BaseFunction {
  example = 'REPT("ha", 3)';
  helpText = ['Repeats text a specified number of times.'];
  helpArgs: HelpArg[] = [
    { name: 'text', description: 'The text to repeat.', type: ['string'] },
    { name: 'number_of_times', description: 'The number of times to repeat the text.', type: ['number'] },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for REPT is incorrect.');
    }
    this.bareArgs[0] = ensureString(this.bareArgs[0]);
    this.bareArgs[1] = ensureNumber(this.bareArgs[1]);
    if (this.bareArgs[1] < 0) {
      throw new FormulaError('#VALUE!', 'REPT: number_of_times must be non-negative.');
    }
  }

  protected main(text: string, times: number) {
    return text.repeat(Math.trunc(times));
  }
}
