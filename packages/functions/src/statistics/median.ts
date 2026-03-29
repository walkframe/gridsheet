import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the median value in a numeric dataset.`;

export class MedianFunction extends BaseFunction {
  example = 'MEDIAN(A1:A100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to compute the median of.',
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
      throw new FormulaError('#NUM!', 'MEDIAN requires at least one numeric value.');
    }
    return [nums];
  }

  protected main(nums: number[]) {
    nums.sort((a, b) => a - b);
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
  }
}
