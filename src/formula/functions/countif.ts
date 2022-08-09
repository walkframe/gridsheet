import { solveMatrix, FormulaError } from "../evaluator";
import { UserTable } from "../../api/table";
import { BaseFunction } from "./__base";
import { check } from "./__utils";

export class CountifFunction extends BaseFunction {
  example = 'COUNTIF(A1:A10,">20")';
  helpText = ["Returns the count of a series of cells."];
  helpArgs = [
    { name: "range", description: "Target range." },
    {
      name: "condition",
      description: "A condition for count.",
    },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for COUNTIF is incorrect."
      );
    }
  }
  // @ts-ignore
  protected main(table: UserTable, condition: string) {
    const matrix = solveMatrix(table, this.base);
    return matrix
      .reduce((a, b) => a.concat(b))
      .filter((v: any) => check(v, condition)).length;
  }
}
