import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class RoundupFunction extends BaseFunction {
  example = "ROUNDUP(99.44,1)";
  helpText = [
    "Round up a number to the specified number of decimal places according to standard rules.",
  ];
  helpArgs = [
    {
      name: "value",
      description: "A number to be rounded up.",
    },
    {
      name: "digit",
      description: "The number of decimal places after rounding.",
      optional: true,
    },
  ];

  protected validate() {
    if (this.args.length !== 1 && this.args.length !== 2) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for ROUNDUP is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.table));
  }
  // @ts-ignore
  protected main(value: number, digit = 0) {
    const multiplier = Math.pow(10, digit);
    return Math.ceil(value * multiplier) / multiplier;
  }
}
