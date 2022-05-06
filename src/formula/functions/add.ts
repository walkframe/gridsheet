import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class AddFunction extends BaseFunction {
  example = "ADD(2, 3)";
  helpText = [
    "Returns the sum of two numbers.",
    "This is the same as the '+' operator.",
  ];
  helpArgs = [
    { name: "value1", description: "First additive." },
    { name: "value2", description: "Second additive." },
  ];

  protected validate() {
    if (this.args.length !== 2) {
      throw new FormulaError(
        "N/A",
        "Number of arguments for ADD is incorrect."
      );
    }
    this.args = this.args.map((arg) => ensureNumber(arg, this.table));
  }
  // @ts-ignore
  protected main(v1: number, v2: number) {
    return v1 + v2;
  }
}
