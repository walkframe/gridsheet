import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class CosFunction extends BaseFunction {
  example = "COS(PI()/2)";
  helpText = ["Returns the cos of the angle specified in radians."];
  helpArgs = [
    {
      name: "angle",
      description: "An angle in radians, at which you want the cos.",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for COS is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.table));
  }
  // @ts-ignore
  protected main(angle: number) {
    return Math.cos(angle);
  }
}
