import { evaluateTable } from "../evaluator";
import { UserTable } from "../../api/tables";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class CountaFunction extends BaseFunction {
  example = "COUNTA(A2:A100,B2:B100,4,26)";
  helpText = ["Returns the number of values in the data set."];
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
        spreaded.push(...evaluateTable(arg, this.table).flat());
        return;
      }
      spreaded.push(ensureNumber(arg, this.table));
    });
    this.args = spreaded;
  }
  // @ts-ignore
  protected main(...values: any[]) {
    return values.filter((v) => v != null && v !== "").length;
  }
}
