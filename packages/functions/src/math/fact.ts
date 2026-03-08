import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class FactFunction extends BaseFunction {
  example = 'FACT(5)';
  helpText = ['Returns the factorial of a number.'];
  helpArgs: HelpArg[] = [
    { name: 'value', description: 'A non-negative integer whose factorial will be returned.', type: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for FACT is incorrect.');
    }
    this.bareArgs[0] = Math.floor(ensureNumber(this.bareArgs[0]));
    if (this.bareArgs[0] < 0) {
      throw new FormulaError('#NUM!', 'FACT requires a non-negative integer.');
    }
  }

  protected main(n: number) {
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
}
