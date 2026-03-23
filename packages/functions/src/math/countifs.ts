import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition, conditionArg } from '@gridsheet/react-core';
import { Sheet, createBooleanMask, ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the count of a range depending on multiple criteria.`;

export class CountifsFunction extends BaseFunction {
  example = 'COUNTIFS(A1:A10, ">20", B1:B10, "<5")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
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
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    const validatedArgs = super.validate(args);
    if (validatedArgs.length % 2 !== 0) {
      throw new FormulaError('#N/A', 'COUNTIFS requires at least one range/condition pair.');
    }
    const refRange = validatedArgs[0] instanceof Sheet ? validatedArgs[0] : null;
    let expectedRows = 0;
    let expectedCols = 0;
    if (refRange) {
      expectedRows = refRange.numRows;
      expectedCols = refRange.numCols;
    }

    const tables: Sheet[] = [];
    const conditions: string[] = [];
    for (let i = 0; i < validatedArgs.length; i += 2) {
      if (!(validatedArgs[i] instanceof Sheet)) {
        throw new FormulaError('#VALUE!', `Argument ${i + 1} of COUNTIFS must be a range.`);
      }
      if (validatedArgs[i].numRows !== expectedRows || validatedArgs[i].numCols !== expectedCols) {
        throw new FormulaError('#VALUE!', 'Array arguments to COUNTIFS are of different size.');
      }
      tables.push(validatedArgs[i] as Sheet);
      conditions.push(ensureString(validatedArgs[i + 1]));
    }
    const mask = createBooleanMask(tables, conditions, this.at);
    return [mask];
  }

  protected main(mask: boolean[][]) {
    let count = 0;
    for (const row of mask) {
      for (const val of row) {
        if (val) {
          count++;
        }
      }
    }
    return count;
  }
}
