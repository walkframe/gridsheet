import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

function gcd(a: number, b: number): number {
  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export class LcmFunction extends BaseFunction {
  example = 'LCM(4, 6)';
  helpText = ['Returns the least common multiple of one or more integers.'];
  helpArgs: HelpArg[] = [
    { name: 'value1', description: 'First integer (must be >= 1).', type: ['number'] },
    { name: 'value2', description: 'Additional integers.', type: ['number'], optional: true, iterable: true },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length === 0) {
      throw new FormulaError('#N/A', 'LCM requires at least one argument.');
    }
    this.bareArgs = this.bareArgs.map((arg) => {
      const n = Math.floor(ensureNumber(arg));
      if (n < 1) {
        throw new FormulaError('#NUM!', 'LCM arguments must be >= 1.');
      }
      return n;
    });
  }

  protected main(...values: number[]) {
    return values.reduce((acc, v) => (acc * v) / gcd(acc, v), 1);
  }
}
