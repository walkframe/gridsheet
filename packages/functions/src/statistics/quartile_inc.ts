import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber, isNumeric } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the quartile of a dataset, based on percentile values from 0 to 1, inclusive.`;

export class QuartileIncFunction extends BaseFunction {
  example = 'QUARTILE.INC(A1:A100, 1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'data',
      description: 'The array or range of data to consider.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
    {
      name: 'quartile_number',
      description: 'Which quartile to return: 0 (min), 1 (Q1), 2 (median), 3 (Q3), 4 (max).',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'statistics';

  protected validate(args: any[]): any[] {
    const q = Math.floor(ensureNumber(args[1]));
    if (q < 0 || q > 4) {
      throw new FormulaError('#NUM!', 'Quartile number must be between 0 and 4.');
    }
    const nums: number[] = [];
    eachMatrix(
      args[0],
      (v: any) => {
        if (v == null || v === '' || typeof v === 'boolean') {
          return;
        }
        if (isNumeric(v)) {
          nums.push(ensureNumber(v));
        }
      },
      this.at,
    );
    if (nums.length === 0) {
      throw new FormulaError('#NUM!', 'QUARTILE.INC requires at least one numeric value.');
    }
    return [nums, q];
  }

  protected main(nums: number[], q: number) {
    nums.sort((a, b) => a - b);
    const k = q / 4;
    const pos = k * (nums.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return nums[lo] + (nums[hi] - nums[lo]) * (pos - lo);
  }
}
