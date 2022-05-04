import { evaluateTable } from "../evaluator";
import { UserTable } from "../../api/tables";
import { BaseFunction } from "./__base";
import { forceNumber } from "./__utils";

export class SumFunction extends BaseFunction {
  example = "SUM(A2:A100, 101)";
  helpText = ["Returns the sum of a series of numbers or cells."];
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
        evaluateTable(arg, this.table).map((row) => {
          row.map((col) => {
            if (typeof col === "number") {
              spreaded.push(col);
            }
          });
        });
        return;
      }
      spreaded.push(forceNumber(arg));
    });
    this.args = spreaded;
  }
  // @ts-ignore
  protected main(...values: number[]) {
    return values.reduce((a, b) => a + b);
  }
}
