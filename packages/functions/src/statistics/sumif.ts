import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table, solveTable, stripTable, ensureString, check, conditionArg } from '@gridsheet/react-core';
import type { AreaType } from '@gridsheet/react-core';

export class SumifFunction extends BaseFunction {
  example = 'SUMIF(A1:A10,">20")';
  helpText = ['Returns the sum of a series of cells.'];
  helpArgs: HelpArg[] = [
    { name: 'range1', description: 'A condition range.', type: ['range'] },
    conditionArg,
    { name: 'range2', description: 'A range to be summarized.', type: ['range'], optional: true },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2 && this.bareArgs.length !== 3) {
      throw new FormulaError('#N/A', 'Number of arguments for SUMIF is incorrect.');
    }
    if (this.bareArgs[2] != undefined && this.bareArgs[2] instanceof Table) {
      throw new FormulaError('#N/A', '3rd argument must be range.');
    }
    this.bareArgs[1] = ensureString(this.bareArgs[1]);
  }

  protected main(range: Table, condition: string, sumRange: Table) {
    if (!(range instanceof Table)) {
      return check(range, condition) ? range : 0;
    }
    const conditionMatrix = solveTable({ table: range });
    let sumMatrix = conditionMatrix;
    if (sumRange) {
      const [top, left] = [sumRange.top, sumRange.left];
      const area: AreaType = {
        top,
        left,
        bottom: top + sumRange.getNumRows(),
        right: left + sumRange.getNumCols(),
      };
      sumMatrix = solveTable({ table: this.table.trim(area) });
    }
    let total = 0;
    conditionMatrix.forEach((row, y) =>
      row.forEach((c, x) => {
        const s = stripTable({ value: sumMatrix[y]?.[x] ?? 0 });
        if (typeof s === 'number' && check(c, condition)) {
          total += s;
        }
      }),
    );
    return total;
  }
}
