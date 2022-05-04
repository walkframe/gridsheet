import { UserTable } from "../../api/tables";

export class BaseFunction {
  example = "_BASE()";
  helpTexts = ["Function's description."];
  helpArgs = [{ name: "value1", description: "" }];

  constructor(public args: any[], public table: UserTable) {
    this.args = args;
    this.table = table;
  }
  protected validate() {}

  protected main() {}
  public call() {
    this.validate();
    // @ts-ignore
    return this.main(...this.args);
  }
}
