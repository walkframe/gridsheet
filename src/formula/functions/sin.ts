import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class SinFunction extends BaseFunction {
  example = "SIN(PI()/2)";
  helpText = ["Returns the sin of the angle specified in radians."];
  helpArgs = [
    {
      name: "angle",
      description: "An angle in radians, at which you want the sin.",
    },
  ];

  protected validate() {
    if (this.args.length !== 1) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for SIN is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg));
  }

  protected main(angle: number) {
    return Math.sin(angle);
  }
}
