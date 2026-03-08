import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the standard deviation based on the entire population.`;

export class StdevPFunction extends BaseFunction {
  example = 'STDEV.P(A1:A100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges representing the entire population.',
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
    if (nums.length < 1) {
      throw new FormulaError('#DIV/0!', 'STDEV.P requires at least 1 numeric value.');
    }
    return [nums];
  }

  protected main(nums: number[]) {
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / nums.length;
    return Math.sqrt(variance);
  }
}
