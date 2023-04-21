import { CellType, PointType, WriterType } from "../types";
import {Table, UserTable} from "../lib/table";
import { solveFormula } from "../formula/solver";
import { FormulaError } from "../formula/evaluator";
import { p2a } from "../lib/converters";
import { TimeDelta } from "../lib/time";
import { format as formatDate } from "date-fns";

type Condition = (value: any) => boolean;
type Stringify = (value: any) => string;

type Props = {
  condition?: Condition;
  complement?: Stringify;
  mixins?: RendererMixinType[];
};

export interface RendererMixinType {
  render?(value: any, table: Table, writer?: WriterType): any
  stringify?(cell: CellType): string;
  string?(value: string, table: UserTable, writer?: WriterType): any;
  bool?(value: boolean, writer?: WriterType): any;
  number?(value: number, writer?: WriterType): any;
  date?(value: Date, writer?: WriterType): any;
  timedelta?(value: TimeDelta, writer?: WriterType): any;
  array?(value: any[], writer?: WriterType): any;
  object?(value: any, writer?: WriterType): any;
  null?(value: null, writer?: WriterType): any;
  undefined?(value: undefined, writer?: WriterType): any;
}

export class Renderer implements RendererMixinType {
  public datetimeFormat: string = "yyyy-MM-dd HH:mm:ss";
  public dateFormat: string = "yyyy-MM-dd";
  public timeDeltaFormat: string = "HH:mm";
  private condition?: Condition;
  private complement?: Stringify;

  constructor(props?: Props) {
    this.applyMixins(props?.mixins);
    if (props == null) {
      return;
    }
    const { condition, complement } = props;
    this.condition = condition;
    this.complement = complement;
  }

  private applyMixins(mixins?: RendererMixinType[]) {
    if (mixins == null) {
      return;
    }
    for (const mixin of mixins) {
      for (const key in mixin) {
        // @ts-ignore
        this[key] = mixin[key];
      }
    }
  }

  public call(table: Table, point: PointType, writer?: WriterType): any {
    const address = p2a(point);
    const cache = table.getSolvedCache(address);
    const value = cache || table.getByPoint(point)?.value;
    const { y, x } = point;
    return this.render(
      value,
      table.trim({ top: y, left: x, bottom: y, right: x }),
      writer
    );
  }

  public render(value: any, table: Table, writer?: WriterType): any {
    if (this.condition && !this.condition(value)) {
      return this.complement ? this.complement(value) : this.stringify(value);
    }

    switch (typeof value) {
      case "object":
        if (value instanceof Date) {
          return this.date(value, writer);
        }
        if (value instanceof TimeDelta) {
          return this.timedelta(value, writer);
        }
        if (value == null) {
          return this.null(value, writer);
        }
        if (value instanceof Table) {
          return this.render(
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
      case "boolean":
        return this.bool(value, writer);
      case "undefined":
        return this.undefined(value, writer);
      case "function":
        return value() as string;
    }
    return "";
  }

  stringify(cell: CellType): string {
    const { value } = cell;
    if (value instanceof Date) {
      return this.date(value);
    }
    if (value instanceof TimeDelta) {
      return this.timedelta(value);
    }
    if (value == null) {
      return "";
    }
    return value.toString();
  }

  string(value: string, table: Table, writer?: WriterType): any {
    if (value[0] === "'") {
      return value.substring(1);
    }
    if (value[0] === "=") {
      const result = solveFormula({ value, table, raise: true });
      if (result == null) {
        // @ts-ignore
        return this[String(result)](result);
      }
      if (result.constructor.name === "Boolean") {
        return String(result).toUpperCase();
      }
      if (result.constructor.name === "Date") {
        return this.date(result);
      }
      return this.render(result, table, writer);
    }
    return value;
  }

  bool(value: boolean, writer?: WriterType): any {
    return value ? "TRUE" : "FALSE";
  }

  number(value: number, writer?: WriterType): any {
    if (isNaN(value)) {
      return "NaN";
    }
    return value;
  }

  date(value: Date, writer?: WriterType): any {
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return formatDate(value, this.dateFormat);
    }
    return formatDate(value, this.datetimeFormat);
  }

  timedelta(value: TimeDelta, writer?: WriterType): any {
    return value.stringify(this.timeDeltaFormat);
  }

  array(value: any[], writer?: WriterType): any {
    return value.map((v) => this.stringify({ value: v })).join(",");
  }

  object(value: any, writer?: WriterType): any {
    return JSON.stringify(value);
  }

  null(value: null, writer?: WriterType): any {
    return "";
  }
  undefined(value: undefined, writer?: WriterType): any {
    return "";
  }
}

export type RendererType = Renderer;
export const defaultRenderer = new Renderer();
