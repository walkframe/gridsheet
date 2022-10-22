import { solveTable } from "../evaluator";
import { Table } from "../../api/table";
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
      if (arg instanceof Table) {
        spreaded.push(...solveTable(arg).reduce((a, b) => a.concat(b)));
        return;
      }
      spreaded.push(ensureNumber(arg));
    });
    this.args = spreaded;
  }

  protected main(...values: any[]) {
    return values.filter((v) => v != null && v !== "").length;
  }
}
