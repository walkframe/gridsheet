import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureString } from './__utils';

export class LenFunction extends BaseFunction {
  example = 'LEN(A2)';
  helpText = ['Returns the length of a string.'];
  helpArgs = [
    {
      name: 'text',
      description: 'A text to be returned the length.',
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for LEN is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
    return text.length;
  }
}
