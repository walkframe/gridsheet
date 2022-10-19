import { Table } from "../../api/table";

export type FunctionProps = {
  args: any[];
  base: Table;
};

export class BaseFunction {
  public example = "_BASE()";
  public helpTexts = ["Function's description."];
  public helpArgs = [{ name: "value1", description: "" }];
  protected args: any[];
  protected base: Table;

  constructor({ args, base }: FunctionProps) {
    this.args = args.map((a) => a.evaluate(base));
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
