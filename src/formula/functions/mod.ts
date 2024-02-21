import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class ModFunction extends BaseFunction {
  example = 'MOD(10, 4)';
  helpText = ['Returns the result of the modulo operation.'];
  helpArgs = [
    {
      name: 'dividend',
      description: 'A number that will be divided by divisor.',
    },
    { name: 'divisor', description: 'A number that will divide a dividend.' },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for MOD is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
    if (this.bareArgs[1] === 0) {
      throw new FormulaError('#DIV/0!', 'The second argument must be non-zero.');
    }
  }

  protected main(v1: number, v2: number) {
    // https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
    return ((v1 % v2) + v2) % v2;
  }
}
