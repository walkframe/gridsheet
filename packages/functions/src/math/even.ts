import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class EvenFunction extends BaseFunction {
  example = 'EVEN(3.1)';
  helpText = ['Rounds a number up to the nearest even integer.'];
  helpArgs: HelpArg[] = [
    { name: 'value', description: 'The value to round up to the nearest even integer.', type: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for EVEN is incorrect.');
    }
    this.bareArgs[0] = ensureNumber(this.bareArgs[0]);
  }

  protected main(value: number) {
    if (value === 0) {
      return 0;
    }
    const sign = value > 0 ? 1 : -1;
    let n = Math.ceil(Math.abs(value));
    if (n % 2 !== 0) {
      n++;
    }
    return sign * n;
  }
}
