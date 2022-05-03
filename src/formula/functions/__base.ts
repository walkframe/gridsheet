export class BaseFunction {
  example = "_BASE()";
  helpTexts = ["Function's description."];
  helpArgs = [{ name: "value1", description: "" }];

  constructor(public args: any[]) {
    this.args = args;
  }
  protected validate() {}

  protected main() {}
  public call() {
    this.validate();
    // @ts-ignore
    return this.main(...this.args);
  }
}
