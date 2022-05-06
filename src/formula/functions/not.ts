import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureBoolean } from "./__utils";

export class NotFunction extends BaseFunction {
  example = "NOT(TRUE)";
  helpText = [
    "Returns the inverse of the Boolean; if TRUE, NOT returns FALSE.",
    "If FALSE, NOT returns TRUE.",
  ];
  helpArgs = [
    {
      name: "logical expression",
      description: "A logical expression as a boolean.",
    },
  ];

  protected validate() {
    if (this.args.length === 1) {
      this.args[0] = ensureBoolean(this.args[0], this.table);
      return;
    }
    throw new FormulaError(
      "N/A",
      "Number of arguments for NOT is incorrect. 1 argument must be specified."
    );
  }
  // @ts-ignore
  protected main(v1: boolean) {
    return !v1;
  }
}
