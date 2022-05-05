import { evaluateTable, FormulaError } from "../evaluator";
import { UserTable } from "../../api/tables";
import { BaseFunction } from "./__base";
import { check } from "./__utils";

export class CountifFunction extends BaseFunction {
  example = 'COUNTIF(A1:A10,">20")';
  helpText = ["Returns the count of a series of cells."];
  helpArgs = [
    { name: "range", description: "Target range." },
    {
      name: "condition",
      description: "A condition to be counted",
    },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for COUNTIF is incorrect."
      );
    }
  }
  // @ts-ignore
  protected main(table: UserTable, condition: string) {
    const matrix = evaluateTable(table, this.table);
    return matrix.flat().filter((v) => check(v, condition)).length;
  }
}
