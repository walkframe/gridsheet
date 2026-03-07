import { FormulaError } from '../evaluator';
import { BaseFunction, HelpArg } from './__base';
import { ensureNumber } from './__utils';

export class DivideFunction extends BaseFunction {
  example = 'DIVIDE(4, 2)';
  helpText = ['Returns the result of dividing one number by another.', "This is the same as the '/' operator."];
  helpArgs: HelpArg[] = [
    {
      name: 'dividend',
      description: 'A number that will be divided by divisor.',
      type: ['number'],
    },
    { name: 'divisor', description: 'A number that will divide a dividend. Must be non-zero.', type: ['number'] },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for DIVIDE is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
    if (this.bareArgs[1] === 0) {
      throw new FormulaError('#DIV/0!', 'The second argument must be non-zero.');
    }
  }

  protected main(divided: number, divisor: number) {
    return divided / divisor;
  }
}
