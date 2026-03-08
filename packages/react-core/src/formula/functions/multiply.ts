import { FormulaError } from '../evaluator';
import { BaseFunction, FunctionCategory, HelpArg } from './__base';
import { ensureNumber } from './__utils';

export class MultiplyFunction extends BaseFunction {
  example = 'MULTIPLY(6, 7)';
  helpText = ['Returns the product of two numbers.', "This is the same as the '*' operator."];
  helpArgs: HelpArg[] = [
    { name: 'factor1', description: 'First factor.', type: ['number'] },
    { name: 'factor2', description: 'Second factor.', type: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for MULTIPLY is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(v1: number, v2: number) {
    return v1 * v2;
  }
}
