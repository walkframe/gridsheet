import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg, conditionArg } from '@gridsheet/react-core';
import { Table, solveTable, stripTable, ensureString, check } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class AverageifsFunction extends BaseFunction {
  example = 'AVERAGEIFS(A1:A10, B1:B10, ">20")';
  helpText = ['Returns the average of a range depending on multiple criteria.'];
  helpArgs: HelpArg[] = [
    { name: 'average_range', description: 'The range to be averaged.', type: ['range'] },
    { name: 'range1', description: 'First condition range.', type: ['range'] },
    { ...conditionArg, name: 'condition1' },
    { name: 'range2', description: 'Additional condition range.', type: ['range'], optional: true, iterable: true },
    { ...conditionArg, name: 'condition2', optional: true, iterable: true },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length < 3 || (this.bareArgs.length - 1) % 2 !== 0) {
      throw new FormulaError('#N/A', 'AVERAGEIFS requires average_range and at least one range/condition pair.');
    }
    if (!(this.bareArgs[0] instanceof Table)) {
      throw new FormulaError('#VALUE!', 'First argument of AVERAGEIFS must be a range.');
    }
    for (let i = 1; i < this.bareArgs.length; i += 2) {
      if (!(this.bareArgs[i] instanceof Table)) {
        throw new FormulaError('#VALUE!', `Argument ${i + 1} of AVERAGEIFS must be a range.`);
      }
      this.bareArgs[i + 1] = ensureString(this.bareArgs[i + 1]);
    }
  }

  protected main(avgRange: Table, ...rest: any[]) {
    const numRows = avgRange.getNumRows();
    const numCols = avgRange.getNumCols();
    const avgMatrix = solveTable({ table: avgRange });

    const mask: boolean[][] = Array.from({ length: numRows }, () => Array(numCols).fill(true));
    for (let p = 0; p < rest.length; p += 2) {
      const condRange: Table = rest[p];
      const condition: string = rest[p + 1];
      const condMatrix = solveTable({ table: condRange });
      condMatrix.forEach((row, y) =>
        row.forEach((c, x) => {
          if (!check(c, condition)) {
            mask[y][x] = false;
          }
        }),
      );
    }

    let total = 0;
    let count = 0;
    avgMatrix.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (mask[y]?.[x]) {
          const v = stripTable({ value: cell ?? 0 });
          if (typeof v === 'number') {
            total += v;
            count++;
          }
        }
      }),
    );
    if (count === 0) {
      return new FormulaError('#DIV/0!', 'No matching cells found for AVERAGEIFS.');
    }
    return total / count;
  }
}
