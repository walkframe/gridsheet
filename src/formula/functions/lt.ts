import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class LtFunction extends BaseFunction {
  example = "LT(3, 6)";
  helpText = [
    "Returns TRUE if the first argument is truely less than the second argument, FALSE otherwise.",
    "This is the same as the '<' operator.",
  ];
  helpArgs = [
    { name: "value1", description: "First value." },
    { name: "value2", description: "A value to be compared with value1." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for LT is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
  }
  // @ts-ignore
  protected main(v1: number, v2: number) {
    return v1 < v2;
  }
}