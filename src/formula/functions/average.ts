import { evaluateTable, FormulaError } from "../evaluator";
import { UserTable } from "../../api/tables";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class AverageFunction extends BaseFunction {
  example = "AVERAGE(A2:A100, 101)";
  helpText = ["Returns the average of a series of numbers or cells."];
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
    const spreaded: number[] = [];
    this.args.map((arg) => {
      if (arg instanceof UserTable) {
        spreaded.push(
          ...evaluateTable(arg, this.base)
            .flat()
            .filter((v) => typeof v === "number")
        );
        return;
      }
      spreaded.push(ensureNumber(arg, this.base));
    });
    if (spreaded.length === 0) {
      throw new FormulaError(
        "N/A",
        "Number of arguments must be greater than 0."
      );
    }
    this.args = spreaded;
  }
  // @ts-ignore
  protected main(...values: number[]) {
    return values.reduce((a, b) => a + b) / values.length;
  }
}
