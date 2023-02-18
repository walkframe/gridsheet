import { Table } from "../../lib/table";
import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";

export class RowFunction extends BaseFunction {
  example = "ROW(A9)";
  helpText = ["Returns the row number of a specified cell."];
  helpArgs = [
    {
      name: "cell_reference",
      description: "The cell whose row number will be returned.",
      option: true,
    },
  ];

  protected validate() {
    if (this.bareArgs.length === 0) {
      this.bareArgs = [this.table];
    } else if (this.bareArgs.length === 1) {
    } else {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for ROW is incorrect."
      );
    }
  }

  protected main(trimmed: Table) {
    return trimmed.top;
  }
}
