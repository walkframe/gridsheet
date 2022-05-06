import { solveMatrix, FormulaError } from "../evaluator";
import { UserTable } from "../../api/tables";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class MaxFunction extends BaseFunction {
  example = "MAX(A2:A100, 101)";
  helpText = ["Returns the max in a series of numbers or cells."];
  helpArgs = [
    { name: "value1", description: "First number or range." },
    {
      name: "value2",
      description: "Additional numbers or ranges",
      optional: true,
      iterable: true,
    },
  ];

  protected validate() {
    if (this.args.length === 0) {
      throw new FormulaError(
        "N/A",
        "Number of arguments must be greater than 0."
      );
    }
    const spreaded: number[] = [];
    this.args.map((arg) => {
      if (arg instanceof UserTable) {
        spreaded.push(
          ...solveMatrix(arg, this.base)
            .flat()
            .filter((v) => typeof v === "number")
        );
        return;
      }
      spreaded.push(ensureNumber(arg, this.base));
    });
    this.args = spreaded;
  }
  // @ts-ignore
  protected main(...values: number[]) {
    if (values.length === 0) {
      return 0;
    }
    return Math.max(...values);
  }
}
