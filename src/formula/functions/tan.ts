import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class TanFunction extends BaseFunction {
  example = "TAN(1)";
  helpText = ["Returns the tan of the angle specified in radians."];
  helpArgs = [
    {
      name: "angle",
      description: "An angle in radians, at which you want the tan.",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for TAN is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
  }
  // @ts-ignore
  protected main(angle: number) {
    return Math.tan(angle);
  }
}
