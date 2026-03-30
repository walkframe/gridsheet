import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber, isNumeric } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the rank of a number in a list of numbers. If more than one value has the same rank, the top rank of that set of values is returned.`;

export class RankEqFunction extends BaseFunction {
  example = 'RANK.EQ(A1, A1:A100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'The value whose rank will be determined.', acceptedTypes: ['number'] },
    {
      name: 'data',
      description: 'The array or range of data to consider.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
    {
      name: 'is_ascending',
      description: 'Whether to rank in ascending order. Default is FALSE (descending).',
      acceptedTypes: ['boolean'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'statistics';

  protected validate(args: any[]): any[] {
    const v = ensureNumber(args[0]);
    const nums: number[] = [];
    eachMatrix(
      args[1],
      (n: any) => {
        if (n == null || n === '' || typeof n === 'boolean') {
          return;
        }
        if (isNumeric(n)) {
          nums.push(ensureNumber(n));
        }
      },
      this.at,
    );
    if (nums.length === 0) {
      throw new FormulaError('#NUM!', 'RANK.EQ requires at least one numeric value in data.');
    }
    if (!nums.includes(v)) {
      throw new FormulaError('#N/A', 'Value not found in data range.');
    }
    const isAscending = args[2] ?? false;
    return [v, nums, isAscending];
  }

  protected main(v: number, nums: number[], isAscending: boolean) {
    nums.sort((a, b) => (isAscending ? a - b : b - a));
    return nums.indexOf(v) + 1;
  }
}
