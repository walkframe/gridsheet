import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg, conditionArg } from '@gridsheet/react-core';
import { Table, solveTable, ensureString, check } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class CountifsFunction extends BaseFunction {
  example = 'COUNTIFS(A1:A10, ">20", B1:B10, "<5")';
  helpText = ['Returns the count of a range depending on multiple criteria.'];
  helpArgs: HelpArg[] = [
    { name: 'range1', description: 'First condition range.', type: ['range'] },
    { ...conditionArg, name: 'condition1' },
    { name: 'range2', description: 'Additional condition range.', type: ['range'], optional: true, iterable: true },
    { ...conditionArg, name: 'condition2', optional: true, iterable: true },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length < 2 || this.bareArgs.length % 2 !== 0) {
      throw new FormulaError('#N/A', 'COUNTIFS requires at least one range/condition pair.');
    }
    for (let i = 0; i < this.bareArgs.length; i += 2) {
      if (!(this.bareArgs[i] instanceof Table)) {
        throw new FormulaError('#VALUE!', `Argument ${i + 1} of COUNTIFS must be a range.`);
      }
      this.bareArgs[i + 1] = ensureString(this.bareArgs[i + 1]);
    }
  }

  protected main(...args: any[]) {
    const firstRange: Table = args[0];
    const numRows = firstRange.getNumRows();
    const numCols = firstRange.getNumCols();
    const mask: boolean[][] = Array.from({ length: numRows }, () => Array(numCols).fill(true));

    for (let p = 0; p < args.length; p += 2) {
      const condRange: Table = args[p];
      const condition: string = args[p + 1];
      const condMatrix = solveTable({ table: condRange });
      condMatrix.forEach((row, y) =>
        row.forEach((c, x) => {
          if (!check(c, condition)) {
            mask[y][x] = false;
          }
        }),
      );
    }

    return mask.reduce((acc, row) => acc + row.filter(Boolean).length, 0);
  }
}
