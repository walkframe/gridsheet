import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class MinusFunction extends BaseFunction {
  example = "MINUS(8, 3)";
  helpText = [
    "Returns the difference of two numbers.",
    "This is the same as the '-' operator.",
  ];
  helpArgs = [
    { name: "value1", description: "A number that will be subtracted." },
    { name: "value2", description: "A number that will subtract from value1." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for MINUS is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.base));
  }
  // @ts-ignore
  protected main(v1: number, v2: number) {
    return v1 - v2;
  }
}
