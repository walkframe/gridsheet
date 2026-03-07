import { FormulaError } from '../evaluator';
import { BaseFunction, HelpArg } from './__base';
import { gte } from './__utils';

export class GteFunction extends BaseFunction {
  example = 'GTE(5, 3)';
  helpText = [
    'Returns TRUE if the first argument is greater than the second, FALSE otherwise.',
    "This is the same as the '>=' operator.",
  ];
  helpArgs: HelpArg[] = [
    { name: 'value1', description: 'First value.', type: ['number'] },
    { name: 'value2', description: 'A value to be compared with value1.', type: ['number'] },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for GTE is incorrect.');
    }
  }

  protected main(v1: number, v2: number) {
    return gte(v1, v2);
  }
}
