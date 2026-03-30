import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber, isNumeric } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the variance based on a sample.`;

export class VarSFunction extends BaseFunction {
  example = 'VAR.S(A1:A100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges representing the sample.',
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
          if (isNumeric(v)) {
            nums.push(ensureNumber(v));
          }
        },
        this.at,
      );
    }
    if (nums.length < 2) {
      throw new FormulaError('#DIV/0!', 'VAR.S requires at least 2 numeric values.');
    }
    return [nums];
  }

  protected main(nums: number[]) {
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return nums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (nums.length - 1);
  }
}
