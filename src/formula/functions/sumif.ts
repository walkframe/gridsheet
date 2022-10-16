import { solveMatrix, FormulaError } from "../evaluator";
import { Table } from "../../api/table";
import { BaseFunction } from "./__base";
import { check, ensureNumber } from "./__utils";
import { AreaType } from "../../types";

export class SumifFunction extends BaseFunction {
  example = 'SUMIF(A1:A10,">20")';
  helpText = ["Returns the sum of a series of cells."];
  helpArgs = [
    { name: "range1", description: "A condition range." },
    {
      name: "condition",
      description: "A condition for summarization.",
    },
    {
      name: "range2",
      description: "A range to be summarized.",
      optional: true,
    },
  ];

  protected validate() {
    if (this.args.length !== 2 && this.args.length !== 3) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for SUMIF is incorrect."
      );
    }
    if (this.args[2] != undefined && this.args[2] instanceof Table) {
      throw new FormulaError("#N/A", "3rd argument must be range.");
    }
  }
  // @ts-ignore
  protected main(range: Table, condition: string, sumRange: Table) {
    if (!(range instanceof Table)) {
      return check(range, condition) ? range : 0;
    }
    const conditionMatrix = solveMatrix(range, this.base);
    let sumMatrix = conditionMatrix;
    if (sumRange) {
      const [top, left] = [sumRange.getTop(), sumRange.getLeft()];
      const area: AreaType = [
        top,
        left,
        top + sumRange.getNumRows(),
        left + sumRange.getNumCols(),
      ];
      sumMatrix = solveMatrix(this.base.trim(area), this.base);
    }
    let total = 0;
    conditionMatrix.map((row, y) =>
      row.map((c, x) => {
        const s = sumMatrix[y]?.[x] || 0;
        if (typeof s === "number" && check(c, condition)) {
          total += s;
        }
      })
    );
    return total;
  }
}
