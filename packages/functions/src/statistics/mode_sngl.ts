import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the most commonly occurring value in a dataset. If there are multiple modes, the smallest is returned.`;

export class ModeSnglFunction extends BaseFunction {
  example = 'MODE.SNGL(A1:A100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to compute the mode of.',
      takesMatrix: true,
      acceptedTypes: ['number', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'statistics';

  protected validate(args: any[]): any[] {
    const nums: number[] = [];
    for (const val of args) {
      eachMatrix(
        val,
        (v: any) => {
          if (v == null || v === '' || typeof v === 'boolean') {
            return;
          }
          if (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))) {
            nums.push(ensureNumber(v));
          }
        },
        this.at,
      );
    }
    if (nums.length === 0) {
      throw new FormulaError('#N/A', 'MODE.SNGL requires at least one numeric value.');
    }
    return [nums];
  }

  protected main(nums: number[]) {
    const freq = new Map<number, number>();
    for (const n of nums) {
      freq.set(n, (freq.get(n) ?? 0) + 1);
    }
    const maxFreq = Math.max(...freq.values());
    if (maxFreq < 2) {
      throw new FormulaError('#N/A', 'No value appears more than once.');
    }
    const modes = [...freq.entries()].filter(([, c]) => c === maxFreq).map(([n]) => n);
    return Math.min(...modes);
  }
}
