import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class RadiansFunction extends BaseFunction {
  example = "RADIANS(180)";
  helpText = ["Converts an angle from degrees to radians."];
  helpArgs = [
    {
      name: "angle",
      description: "The angle to convert from degrees to radians.",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for RADIANS is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
  }

  protected main(angle: number) {
    return (angle / 180) * Math.PI;
  }
}
