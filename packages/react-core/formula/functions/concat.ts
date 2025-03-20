import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureString } from './__utils';

export class ConcatFunction extends BaseFunction {
  example = 'CONCAT("Hello", "World")';
  helpText = ['Returns the concatenation of two values.', "This is the same as the '&' operator."];
  helpArgs = [
    { name: 'value1', description: 'A value to be concatenated with value2.' },
    { name: 'value2', description: 'A value to be concatenated with value1' },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for CONCAT is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureString(arg));
  }

  protected main(v1: string, v2: string) {
    return v1 + v2;
  }
}
