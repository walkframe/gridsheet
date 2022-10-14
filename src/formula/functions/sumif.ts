import { solveMatrix, FormulaError } from "../evaluator";
import { UserTable } from "../../api/table";
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
    if (
      this.args[Area.Bottom] != undefined &&
      this.args[Area.Bottom] instanceof UserTable
    ) {
      throw new FormulaError("#N/A", "3rd argument must be range.");
    }
  }
  // @ts-ignore
  protected main(range: UserTable, condition: string, sumRange: UserTable) {
    if (!(range instanceof UserTable)) {
      return check(range, condition) ? range : 0;
    }
    const conditionMatrix = solveMatrix(range, this.base);
    let sumMatrix = conditionMatrix;
    if (sumRange) {
      const [top, left] = [sumRange.top(), sumRange.left()];
      const area: AreaType = [
        top,
        left,
        top + sumRange.numRows(),
        left + sumRange.numCols(),
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
