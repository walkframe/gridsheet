import { Lexer } from "../formula/lexer";
import { Parser } from "../formula/parser";
import React from "react";
import { CellType, WriterType } from "../types";
import { UserTable } from "../api/tables";

type Condition = (value: any) => boolean;
type Stringify = (value: any) => string;

type Props = {
  condition?: Condition;
  complement?: Stringify;
};

export class Renderer {
  private condition?: Condition;
  private complement?: Stringify;

  constructor(props?: Props) {
    if (props == null) {
      return;
    }
    const { condition, complement } = props;
    this.condition = condition;
    this.complement = complement;
  }

  public render(
    table: UserTable,
    y: number,
    x: number,
    writer?: WriterType
  ): any {
    const cell = table.get(y, x);
    const { value } = cell || {};
    if (this.condition && !this.condition(value)) {
      return this.complement ? this.complement(value) : this.stringify(value);
    }

    switch (typeof value) {
      case "object":
        if (value instanceof Date) {
          return this.date(value, writer);
        }
        if (value == null) {
          return this.null(value, writer);
        }
        if (Array.isArray(value)) {
          return this.array(value, writer);
        }
        return this.object(value, writer);
      case "string":
        return this.string(value, table, writer);
      case "number":
        return this.number(value, writer);
      case "function":
        return value() as string;
      case "boolean":
        return this.bool(value, writer);
      case "undefined":
        return this.undefined(value, writer);
    }
    return "";
  }

  public stringify(cell: CellType): string {
    const { value } = cell;
    if (value instanceof Date) {
      return this.date(value);
    }
    if (value == null) {
      return "";
    }
    return value.toString();
  }

  protected string(value: string, table: UserTable, writer?: WriterType): any {
    if (value[0] === "'") {
      return value.substring(1);
    }
    if (value[0] === "=") {
      const lexer = new Lexer(value.substring(1));
      lexer.tokenize();
      const parser = new Parser(lexer.tokens);
      const expr = parser.build();
      if (expr) {
        return expr.eval(table);
      }
      return "";
    }
    return value;
  }

  protected bool(value: boolean, writer?: WriterType): any {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          writer && writer(e.currentTarget.checked.toString());
          e.currentTarget.blur();
        }}
      />
    );
  }

  protected number(value: number, writer?: WriterType): any {
    if (isNaN(value)) {
      return "NaN";
    }
    return value;
  }

  protected date(value: Date, writer?: WriterType): any {
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return value.toLocaleDateString();
    }
    return value.toLocaleString();
  }

  protected array(value: any[], writer?: WriterType): any {
    return value.map((v) => this.stringify({ value: v })).join(",");
  }

  protected object(value: any, writer?: WriterType): any {
    return JSON.stringify(value);
  }

  protected null(value: null, writer?: WriterType): any {
    return "";
  }
  protected undefined(value: undefined, writer?: WriterType): any {
    return "";
  }
}

export type RendererType = Renderer;
export const defaultRenderer = new Renderer();
