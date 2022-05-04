import { BaseFunction } from "./__base";
import { forceBoolean } from "./__utils";

export class OrFunction extends BaseFunction {
  example = "Or(A1=1, A2=2)";
  helpText = [
    "Returns TRUE if any argument is logically true.",
    "Returns FALSE if all arguments are logically false.",
  ];
  helpArgs = [
    { name: "expression1", description: "First logical expression." },
    {
      name: "expression2",
      description: "Additional expressions",
      optional: true,
      iterable: true,
    },
  ];

  protected validate() {
    this.args = this.args.map((arg) => forceBoolean(arg));
  }
  // @ts-ignore
  protected main(...values: boolean[]) {
    return values.reduce((a, b) => a || b);
  }
}
