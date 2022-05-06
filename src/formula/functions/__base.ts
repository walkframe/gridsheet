import { UserTable } from "../../api/tables";

export class BaseFunction {
  public example = "_BASE()";
  public helpTexts = ["Function's description."];
  public helpArgs = [{ name: "value1", description: "" }];

  constructor(public args: any[], public base: UserTable) {
    this.args = args;
    this.base = base;
  }
  protected validate() {}

  protected main() {}
  public call() {
    this.validate();
    // @ts-ignore
    return this.main(...this.args);
  }
}

export type FunctionMapping = { [s: string]: typeof BaseFunction };
