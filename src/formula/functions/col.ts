import { Table } from "../../api/table";
import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";

export class ColFunction extends BaseFunction {
  example = "Col(A9)";
  helpText = ["Returns the col number of a specified cell."];
  helpArgs = [
    {
      name: "cell_reference",
      description: "The cell whose col number will be returned.",
      option: true,
    },
  ];

  protected validate() {
    if (this.args.length === 0) {
      this.args = [this.table];
    } else if (this.args.length === 1) {
    } else {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for COL is incorrect."
      );
    }
  }

  protected main(trimmed: Table) {
    return trimmed.left;
  }
}
