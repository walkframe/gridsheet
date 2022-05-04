import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";

export class NeFunction extends BaseFunction {
  example = "NE(6, 7)";
  helpText = [
    "Returns TRUE if the two specified values are not equal, FALSE if they are.",
    "This is the same as the '<>' operator.",
  ];
  helpArgs = [
    { name: "value1", description: "First value." },
    { name: "value2", description: "A value to be compared with value1." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError("N/A", "Number of arguments for NE is incorrect.");
    }
  }
  // @ts-ignore
  protected main(v1: number, v2: number) {
    return v1 !== v2;
  }
}
