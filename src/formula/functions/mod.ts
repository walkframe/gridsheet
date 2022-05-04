import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { forceNumber } from "./__utils";

export class ModFunction extends BaseFunction {
  example = "MOD(10, 4)";
  helpText = ["Returns the result of the modulo operation."];
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
        "Number of arguments for MOD is incorrect."
      );
    }
    this.args = this.args.map((arg) => forceNumber(arg));
    if (this.args[1] === 0) {
      throw new FormulaError("DIV/0!", "The second argument must be non-zero.");
    }
  }
  // @ts-ignore
  protected main(v1: number, v2: number) {
    return v1 % v2;
  }
}
