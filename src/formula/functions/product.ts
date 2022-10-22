import { solveMatrix } from "../evaluator";
import { Table } from "../../api/table";
import { BaseFunction } from "./__base";
import { ensureNumber } from "./__utils";

export class ProductFunction extends BaseFunction {
  example = "PRODUCT(A2:A100)";
  helpText = ["Returns the product of a series of numbers or cells."];
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
      if (arg instanceof Table) {
        spreaded.push(
          ...solveMatrix(arg, this.base)
            .reduce((a, b) => a.concat(b))
            .filter((v: any) => typeof v === "number")
        );
        return;
      }
      spreaded.push(ensureNumber(arg, this.base));
    });
    this.args = spreaded;
  }

  protected main(...values: number[]) {
    return values.reduce((a, b) => a * b);
  }
}
