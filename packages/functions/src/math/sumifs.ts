import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, conditionArg } from '@gridsheet/core';
import {
  Sheet,
  eachMatrix,
  stripMatrix,
  createBooleanMask,
  ensureString,
  ensureNumber,
  isNumeric,
} from '@gridsheet/core';
import type { PointType } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the sum of a range depending on multiple criteria.`;

export class SumifsFunction extends BaseFunction {
  example = 'SUMIFS(A1:A10, B1:B10, ">20")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'sum_range', description: 'The range to be summed.', takesMatrix: true, acceptedTypes: ['matrix'] },
    {
      name: 'range',
      description: 'First condition range.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
      variadic: true,
    },
    { ...conditionArg, name: 'condition', variadic: true },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    const validatedArgs = super.validate(args);
    if ((validatedArgs.length - 1) % 2 !== 0) {
      throw new FormulaError('#N/A', 'SUMIFS requires sum_range and at least one range/condition pair.');
    }
    if (!(validatedArgs[0] instanceof Sheet)) {
      throw new FormulaError('#VALUE!', 'First argument of SUMIFS must be a range.');
    }
    const expectedRows = validatedArgs[0].numRows;
    const expectedCols = validatedArgs[0].numCols;

    const tables: Sheet[] = [];
    const conditions: string[] = [];
    for (let i = 1; i < validatedArgs.length; i += 2) {
      if (!(validatedArgs[i] instanceof Sheet)) {
        throw new FormulaError('#VALUE!', `Argument ${i + 1} of SUMIFS must be a range.`);
      }
      if (validatedArgs[i].numRows !== expectedRows || validatedArgs[i].numCols !== expectedCols) {
        throw new FormulaError('#VALUE!', 'Array arguments to SUMIFS are of different size.');
      }
      tables.push(validatedArgs[i] as Sheet);
      conditions.push(ensureString(validatedArgs[i + 1]));
    }
    const sumRange = validatedArgs[0];
    const mask = createBooleanMask(tables, conditions, this.at);
    return [sumRange, mask];
  }

  protected main(sumRange: Sheet, mask: boolean[][]) {
    let total = 0;
    eachMatrix(
      sumRange,
      (v: any, pt: PointType) => {
        if (pt && mask[pt.y][pt.x]) {
          const num = stripMatrix(v ?? 0, this.at);
          if (isNumeric(num)) {
            total += ensureNumber(num);
          }
        }
      },
      this.at,
    );

    return total;
  }
}
