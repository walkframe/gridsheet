import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureBoolean } from './__utils';

export class NotFunction extends BaseFunction {
  example = 'NOT(TRUE)';
  helpText = ['Returns the inverse of the Boolean; if TRUE, NOT returns FALSE.', 'If FALSE, NOT returns TRUE.'];
  helpArgs = [
    {
      name: 'logical expression',
      description: 'A logical expression as a boolean.',
    },
  ];

  protected validate() {
    if (this.bareArgs.length === 1) {
      this.bareArgs[0] = ensureBoolean(this.bareArgs[0]);
      return;
    }
    throw new FormulaError('#N/A', 'Number of arguments for NOT is incorrect. 1 argument must be specified.');
  }

  protected main(v1: boolean) {
    return !v1;
  }
}
