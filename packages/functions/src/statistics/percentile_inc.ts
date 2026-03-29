import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the k-th percentile of values in a range, where k is in the range 0 to 1, inclusive.`;

export class PercentileIncFunction extends BaseFunction {
  example = 'PERCENTILE.INC(A1:A100, 0.9)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'data',
      description: 'The array or range of data to consider.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
    { name: 'percentile', description: 'The percentile value between 0 and 1, inclusive.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'statistics';

  protected validate(args: any[]): any[] {
    const k = ensureNumber(args[1]);
    if (k < 0 || k > 1) {
      throw new FormulaError('#NUM!', 'Percentile must be between 0 and 1.');
    }
    const nums: number[] = [];
    eachMatrix(
      args[0],
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
    if (nums.length === 0) {
      throw new FormulaError('#NUM!', 'PERCENTILE.INC requires at least one numeric value.');
    }
    return [nums, k];
  }

  protected main(nums: number[], k: number) {
    nums.sort((a, b) => a - b);
    const pos = k * (nums.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return nums[lo] + (nums[hi] - nums[lo]) * (pos - lo);
  }
}
