import { FormulaError } from "../evaluator";
import { solveTable } from "../solver";
import { Table } from "../../api/table";
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

  protected main(table: Table, condition: string) {
    const matrix = solveTable(table);
    return matrix
      .reduce((a, b) => a.concat(b))
      .filter((v: any) => check(v, condition)).length;
  }
}
