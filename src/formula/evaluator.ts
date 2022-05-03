import { cellToIndexes } from "../api/converters";
import { UserTable } from "../api/tables";
import { mapping } from "./functions/__mapping";

export class FormulaError {
  constructor(public code: string, public message: string) {
    this.code = code;
    this.message = message;
  }
}

export class Value {
  constructor(public data?: any) {
    this.data = data;
  }
  public eval(table: UserTable) {
    return this.data;
  }
}

export class Ref {
  constructor(public ref: string) {
    this.ref = ref;
  }
  public eval(table: UserTable): any {
    const [y, x] = cellToIndexes(this.ref.toUpperCase());
    return table.get(y, x)?.value || 0;
  }
}

export class Function {
  public args: Expression[];
  constructor(public name: string, public precedence = 0) {
    this.name = name;
    this.precedence = precedence;
    this.args = [];
  }

  public eval(table: UserTable): any {
    const args = this.args.map((a) => a.eval(table));
    const name = this.name.toLowerCase() as keyof typeof mapping;
    const func = mapping[name];
    if (func == null) {
      throw new FormulaError("NAME?", "Unknown function");
    }
    // @ts-ignore
    return func(...args);
  }
}

export type Expression = Value | Ref | Function;
