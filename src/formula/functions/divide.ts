import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class DivideFunction extends BaseFunction {
  example = "DIVIDE(4, 2)";
  helpText = [
    "Returns the result of dividing one number by another.",
    "This is the same as the '/' operator.",
  ];
  helpArgs = [
    {
      name: "dividend",
      description: "A number that will be divided by divisor.",
    },
    { name: "divisor", description: "A number that will divide a dividend." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for DIVIDE is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
    if (this.args[1] === 0) {
      throw new FormulaError("DIV/0!", "The second argument must be non-zero.");
    }
  }
  // @ts-ignore
  protected main(divided: number, divisor: number) {
    return divided / divisor;
  }
}
