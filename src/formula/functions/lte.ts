import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { lte } from './__utils';

export class LteFunction extends BaseFunction {
  example = 'LTE(3, 6)';
  helpText = [
    'Returns TRUE if the first argument is less than the second argument, FALSE otherwise.',
    "This is the same as the '<=' operator.",
  ];
  helpArgs = [
    { name: 'value1', description: 'First value.' },
    { name: 'value2', description: 'A value to be compared with value1.' },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for LTE is incorrect.');
    }
  }

  protected main(v1: number, v2: number) {
    return lte(v1, v2);
  }
}
