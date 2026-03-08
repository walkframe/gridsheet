import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
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

const description = `Returns the least common multiple of one or more integers.`;

export class LcmFunction extends BaseFunction {
  example = 'LCM(4, 6)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'Integers (must be >= 1).', acceptedTypes: ['number'], variadic: true },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    if (args.length === 0) {
      throw new FormulaError('#N/A', 'LCM requires at least one argument.');
    }
    return args.map((arg) => {
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
