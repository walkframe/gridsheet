import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, conditionArg } from '@gridsheet/core';
import { Sheet, eachMatrix, stripMatrix, createBooleanMask, ensureString } from '@gridsheet/core';
import type { FunctionCategory, PointType } from '@gridsheet/core';

const description = `Returns the average of a range depending on multiple criteria.`;

export class AverageifsFunction extends BaseFunction {
  example = 'AVERAGEIFS(A1:A10, B1:B10, ">20")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'average_range', description: 'The range to be averaged.', takesMatrix: true, acceptedTypes: ['matrix'] },
    { name: 'range1', description: 'First condition range.', takesMatrix: true, acceptedTypes: ['matrix'] },
    { ...conditionArg, name: 'condition1' },
    {
      name: 'range2',
      description: 'Additional condition range.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
      optional: true,
      variadic: true,
    },
    { ...conditionArg, name: 'condition2', optional: true, variadic: true },
  ];
  category: FunctionCategory = 'statistics';

  protected validate(args: any[]): any[] {
    const validatedArgs = super.validate(args);
    if ((validatedArgs.length - 1) % 2 !== 0) {
      throw new FormulaError('#N/A', 'AVERAGEIFS requires average_range and at least one range/condition pair.');
    }
    if (!(validatedArgs[0] instanceof Sheet)) {
      throw new FormulaError('#VALUE!', 'First argument of AVERAGEIFS must be a range.');
    }
    const expectedRows = validatedArgs[0].numRows;
    const expectedCols = validatedArgs[0].numCols;

    const tables: Sheet[] = [];
    const conditions: string[] = [];
    for (let i = 1; i < validatedArgs.length; i += 2) {
      if (!(validatedArgs[i] instanceof Sheet)) {
        throw new FormulaError('#VALUE!', `Argument ${i + 1} of AVERAGEIFS must be a range.`);
      }
      if (validatedArgs[i].numRows !== expectedRows || validatedArgs[i].numCols !== expectedCols) {
        throw new FormulaError('#VALUE!', 'Array arguments to AVERAGEIFS are of different size.');
      }
      tables.push(validatedArgs[i] as Sheet);
      conditions.push(ensureString(validatedArgs[i + 1]));
    }
    const avgRange = validatedArgs[0];
    const mask = createBooleanMask(tables, conditions, this.at);
    return [avgRange, mask];
  }

  protected main(avgRange: Sheet, mask: boolean[][]) {
    let total = 0;
    let count = 0;
    eachMatrix(
      avgRange,
      (v: any, pt: PointType) => {
        if (pt && mask[pt.y][pt.x]) {
          const num = stripMatrix(v ?? 0, this.at);
          if (typeof num === 'number') {
            total += num;
            count++;
          }
        }
      },
      this.at,
    );

    if (count === 0) {
      return new FormulaError('#DIV/0!', 'No matching cells found for AVERAGEIFS.');
    }
    return total / count;
  }
}
