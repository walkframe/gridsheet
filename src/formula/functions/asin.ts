import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class AsinFunction extends BaseFunction {
  example = "ASIN(0)";
  helpText = ["Returns the inverse sin of the value in radians."];
  helpArgs = [
    {
      name: "value",
      description: "A value for the inverse sin between -1 and 1.",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for ASIN is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
    if (-1 > this.args[0] || this.args[0] > 1) {
      throw new FormulaError("#NUM!", "value must be between -1 and 1");
    }
  }

  protected main(value: number) {
    return Math.asin(value);
  }
}
