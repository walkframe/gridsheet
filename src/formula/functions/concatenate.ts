import { BaseFunction } from "./__base";
import { forceString } from "./__utils";

export class ConcatenateFunction extends BaseFunction {
  example = 'CONCATENATE("Hello", "World")';
  helpText = ["Returns the concatenation of the values."];
  helpArgs = [
    { name: "value1", description: "First string value." },
    {
      name: "value2",
      description:
        "Additional string values to be concatenated with the value1",
      optional: true,
      iterable: true,
    },
  ];

  protected validate() {
    this.args = this.args.map((arg) => forceString(arg, this.table));
  }
  // @ts-ignore
  protected main(...values: string[]) {
    return values.reduce((a, b) => a + b);
  }
}
