import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class SqrtFunction extends BaseFunction {
  example = "SQRT(9)";
  helpText = ["Returns the positive square root of a positive number."];
  helpArgs = [
    {
      name: "value",
      description:
        "A number for which the positive square root is to be found.",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for SQRT is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg));
    if (this.args[0] < 0) {
      throw new FormulaError("NUM!", "First argument must be positive.");
    }
  }

  protected main(value: number) {
    return Math.sqrt(value);
  }
}
