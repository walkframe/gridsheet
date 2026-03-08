import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class OddFunction extends BaseFunction {
  example = 'ODD(2.3)';
  helpText = ['Rounds a number up to the nearest odd integer.'];
  helpArgs: HelpArg[] = [
    { name: 'value', description: 'The value to round up to the nearest odd integer.', type: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ODD is incorrect.');
    }
    this.bareArgs[0] = ensureNumber(this.bareArgs[0]);
  }

  protected main(value: number) {
    if (value === 0) {
      return 1;
    }
    const sign = value > 0 ? 1 : -1;
    let n = Math.ceil(Math.abs(value));
    if (n % 2 === 0) {
      n++;
    }
    return sign * n;
  }
}
