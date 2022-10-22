import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class AbsFunction extends BaseFunction {
  example = "ABS(-2)";
  helpText = ["Returns the absolute value of a number"];
  helpArgs = [{ name: "value", description: "target number" }];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for ABS is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
  }

  protected main(value: number) {
    return Math.abs(value);
  }
}
