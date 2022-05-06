import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class Log10Function extends BaseFunction {
  example = "LOG10(100)";
  helpText = ["Returns the logarithm of 10"];
  helpArgs = [
    {
      name: "value",
      description: "The value for the logarithm of 10",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for LOG10 is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.table));
    if (this.args[0] <= 0) {
      throw new FormulaError("NUM!", "value must be greater than 0");
    }
  }
  // @ts-ignore
  protected main(value: number) {
    return Math.log10(value);
  }
}
