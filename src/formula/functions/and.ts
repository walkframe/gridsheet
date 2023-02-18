import { BaseFunction } from "./__base";
import { ensureBoolean } from "./__utils";

export class AndFunction extends BaseFunction {
  example = "AND(A1=1, A2=2)";
  helpText = [
    "Returns TRUE if all arguments are logically TRUE.",
    "Returns FALSE if any argument is logically FALSE.",
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
    this.bareArgs = this.bareArgs.map((arg) => ensureBoolean(arg));
  }

  protected main(...values: boolean[]) {
    return values.reduce((a, b) => a && b);
  }
}
