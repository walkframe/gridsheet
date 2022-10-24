import { FormulaError } from "../evaluator";
import { solveTable } from "../solver";
import { Table } from "../../api/table";
import { BaseFunction } from "./__base";
import { check } from "./__utils";
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
        const s = sumMatrix[y]?.[x] || 0;
        if (typeof s === "number" && check(c, condition)) {
          total += s;
        }
      })
    );
    return total;
  }
}
