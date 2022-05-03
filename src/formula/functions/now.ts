import { FormulaError } from "../parser";
import { BaseFunction } from "./__base";

export class NowFunction extends BaseFunction {
  example = "NOW()";
  helpText = [
    "Returns a serial value corresponding to the current date and time.",
  ];
  helpArgs = [];

  protected validate() {
    if (this.args.length !== 0) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for NOW is incorrect."
      );
    }
  }
  // @ts-ignore
  protected main() {
    return new Date();
  }
}
