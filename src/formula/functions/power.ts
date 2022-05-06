import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class PowerFunction extends BaseFunction {
  example = "POWER(4,0.5)";
  helpText = ["Returns a number multiplied by an exponent."];
  helpArgs = [
    { name: "base", description: "A number to be multiplied by an exponent." },
    { name: "exponent", description: "An exponent to power the base." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for POWER is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.table));
  }
  // @ts-ignore
  protected main(v1: number, v2: number) {
    return Math.pow(v1, v2);
  }
}
