import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { eq } from './__utils';

export class EqFunction extends BaseFunction {
  example = 'EQ(6, 7)';
  helpText = [
    'Returns TRUE if the two specified values are equal, FALSE if they are not.',
    "This is the same as the '=' operator.",
  ];
  helpArgs = [
    { name: 'value1', description: 'First value.' },
    { name: 'value2', description: 'A value to be compared with value1.' },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for EQ is incorrect.');
    }
  }

  protected main(v1: any, v2: any) {
    return eq(v1, v2);
  }
}
