import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class LnFunction extends BaseFunction {
  example = "LN(100)";
  helpText = ["Returns the logarithm of e"];
  helpArgs = [
    {
      name: "value",
      description: "The value for the logarithm of e",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for LN is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
    if (this.args[0] <= 0) {
      throw new FormulaError("NUM!", "value must be greater than 0");
    }
  }
  // @ts-ignore
  protected main(value: number) {
    return Math.log(value);
  }
}
