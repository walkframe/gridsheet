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
    this.args = this.args.map((arg) => forceNumber(arg));
  }
  // @ts-ignore
  protected main(...values: number[]) {
    return values.reduce((a, b) => a + b);
  }
}
