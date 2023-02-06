import React from "react";
import { CellType, PointType, WriterType } from "../types";
import { Table } from "../lib/table";
import { solveFormula } from "../formula/solver";
import { FormulaError } from "../formula/evaluator";
import { p2a } from "../lib/converters";
import { format as formatDate } from "date-fns";

type Condition = (value: any) => boolean;
type Stringify = (value: any) => string;

type Props = {
  condition?: Condition;
  complement?: Stringify;
};

export class Renderer {
  public datetimeFormat: string = "yyyy-MM-dd HH:mm:ss";
  public dateFormat: string = "yyyy-MM-dd";
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

  public render(table: Table, point: PointType, writer?: WriterType): any {
    const address = p2a(point);
    const cache = table.getSolvedCache(address);
    const value = cache || table.getByPoint(point)?.value;
    const { y, x } = point;
    return this._render(
      value,
      table.trim({ top: y, left: x, bottom: y, right: x }),
      writer
    );
  }

  public _render(value: any, table: Table, writer?: WriterType): any {
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
        if (value instanceof Table) {
          return this._render(
            value.getByPoint({ y: value.top, x: value.left })?.value,
            table,
            writer
          );
        }
        if (Array.isArray(value)) {
          return this.array(value, writer);
        }
        if (value instanceof FormulaError) {
          throw value;
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

  protected string(value: string, table: Table, writer?: WriterType): any {
    if (value[0] === "'") {
      return value.substring(1);
    }
    if (value[0] === "=") {
      const result = solveFormula({ value, table, raise: true });

      if (result == null) {
        return "";
      }
      if (result.constructor.name === "Boolean") {
        return String(result).toUpperCase();
      }
      if (result.constructor.name === "Date") {
        return this.date(result);
      }
      return this._render(result, table, writer);
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
      return formatDate(value, this.dateFormat);
    }
    return formatDate(value, this.datetimeFormat);
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
