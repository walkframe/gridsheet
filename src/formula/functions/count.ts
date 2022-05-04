import { evaluateTable } from "../evaluator";
import { UserTable } from "../../api/tables";
import { BaseFunction } from "./__base";
import { forceNumber } from "./__utils";

export class CountFunction extends BaseFunction {
  example = "COUNT(A2:A100,B2:B100,4,26)";
  helpText = ["Returns the count of a series of numbers or cells."];
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
    const spreaded: any[] = [];
    this.args.map((arg) => {
      if (arg instanceof UserTable) {
        evaluateTable(arg, this.table).map((row) => {
          row.map((col) => {
            spreaded.push(col);
          });
        });
        return;
      }
      spreaded.push(forceNumber(arg));
    });
    this.args = spreaded;
  }
  // @ts-ignore
  protected main(...values: any[]) {
    return values.filter((v) => v != null && v !== "").length;
  }
}
