import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { forceNumber } from "./__utils";

export class MultiplyFunction extends BaseFunction {
  example = "MULTIPLY(6, 7)";
  helpText = [
    "Returns the product of two numbers.",
    "This is the same as the '*' operator.",
  ];
  helpArgs = [
    { name: "factor1", description: "First factor." },
    { name: "factor2", description: "Second factor." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for MULTIPLY is incorrect."
      );
    }
    this.args = this.args.map((arg) => forceNumber(arg));
  }
  // @ts-ignore
  protected main(v1: number, v2: number) {
    return v1 * v2;
  }
}
