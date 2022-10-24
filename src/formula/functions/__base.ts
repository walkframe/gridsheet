import { Table } from "../../api/table";

export type FunctionProps = {
  args: any[];
  table: Table;
};

export class BaseFunction {
  public example = "_BASE()";
  public helpTexts = ["Function's description."];
  public helpArgs = [{ name: "value1", description: "" }];
  protected args: any[];
  protected table: Table;

  constructor({ args, table }: FunctionProps) {
    this.args = args.map((a) => a.evaluate({ table }));
    this.table = table;
  }
  protected validate() {}

  public call() {
    this.validate();

    // @ts-ignore
    return this.main(...this.args);
  }
}

export type FunctionMapping = { [functionName: string]: any };
