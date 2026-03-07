import { FormulaError } from '../evaluator';
import { BaseFunction, HelpArg } from './__base';
import { ne } from './__utils';

export class NeFunction extends BaseFunction {
  example = 'NE(6, 7)';
  helpText = [
    'Returns TRUE if the two specified values are not equal, FALSE if they are.',
    "This is the same as the '<>' operator.",
  ];
  helpArgs: HelpArg[] = [
    { name: 'value1', description: 'First value.', type: ['number'] },
    { name: 'value2', description: 'A value to be compared with value1.', type: ['number'] },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for NE is incorrect.');
    }
  }

  protected main(v1: number, v2: number) {
    return ne(v1, v2);
  }
}
