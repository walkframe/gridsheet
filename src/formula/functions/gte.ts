import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class GteFunction extends BaseFunction {
  example = "GTE(5, 3)";
  helpText = [
    "Returns TRUE if the first argument is greater than the second, FALSE otherwise.",
    "This is the same as the '>=' operator.",
  ];
  helpArgs = [
    { name: "value1", description: "First value." },
    { name: "value2", description: "A value to be compared with value1." },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for GTE is incorrect."
      );
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(v1: number, v2: number) {
    return v1 >= v2;
  }
}
