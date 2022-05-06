import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class LogFunction extends BaseFunction {
  example = "LOG(128, 2)";
  helpText = [
    "Returns the logarithm of a number whose base is the specified number.",
  ];
  helpArgs = [
    {
      name: "value",
      description:
        "The value for the logarithm of the specified number as base.",
    },
    { name: "base", description: "An exponent to power the base." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for LOG is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
    if (this.args[0] <= 0) {
      throw new FormulaError("NUM!", "value must be greater than 0");
    }
    if (this.args[1] <= 1) {
      throw new FormulaError("NUM!", "base must be greater than 1");
    }
  }
  // @ts-ignore
  protected main(value: number, base: number) {
    return Math.log2(value) / Math.log2(base);
  }
}
