import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureBoolean } from './__utils';

export class IfFunction extends BaseFunction {
  example = 'IF(A2 = "Human", "Hello", "World")';
  helpText = [
    'If the logical expression is TRUE, the second argument is returned.',
    'If FALSE, the third argument is returned.',
  ];
  helpArgs = [
    { name: 'condition', description: 'An expression as a condition' },
    {
      name: 'value1',
      description: 'value to be returned if the condition is true.',
    },
    {
      name: 'value2',
      description: 'value to be returned if the condition is false.',
      optional: true,
    },
  ];

  protected validate() {
    if (this.bareArgs.length === 2 || this.bareArgs.length === 3) {
      this.bareArgs[0] = ensureBoolean(this.bareArgs[0]);
      return;
    }
    throw new FormulaError('#N/A', 'Number of arguments for IF is incorrect. 2 or 3 arguments must be specified.');
  }

  protected main(condition: boolean, v1: any, v2: any = false) {
    return condition ? v1 : v2;
  }
}
