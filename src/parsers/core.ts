import { parseFromTimeZone } from "date-fns-timezone";
import { CellType } from "../types";

type Condition = (value: string) => boolean;
type Stringify = (value: string) => any;

type Props = {
  condition?: Condition;
  complement?: Stringify;
};

export class Parser {
  protected parseFunctions: ((value: string, cell: CellType) => any)[] = [
    this.number,
    this.date,
    this.bool,
  ];

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

  public callback(parsed: any, cell: CellType) {
    return parsed;
  }
  public parse(value: string, cell: CellType): CellType {
    const parsed = this._parse(value, cell);
    return { ...cell, value: parsed };
  }
  protected _parse(value: string, cell: CellType): any {
    if (this.condition && !this.condition(value)) {
      const result = this.complement ? this.complement(value) : value;
      return this.callback(result, cell);
    }
    if (value[0] === "'") {
      return this.callback(value, cell);
    }
    for (let i = 0; i < this.parseFunctions.length; i++) {
      const result = this.parseFunctions[i](value, cell);
      if (result != null) {
        return this.callback(result, cell);
      }
    }
    if (value === "") {
      return this.callback(null, cell);
    }
    return this.callback(value, cell);
  }

  protected bool(value: string, cell: CellType): boolean | undefined {
    // @ts-ignore
    return { true: true, false: false }[value];
  }

  protected number(value: string, cell: CellType): number | undefined {
    const m = value.match(/^-?[\d.]+$/);
    if (
      m != null &&
      value.match(/\.$/) == null &&
      (value.match(/\./g) || []).length <= 1
    ) {
      return parseFloat(value);
    }
  }

  protected date(value: string, cell: CellType): Date | undefined {
    const first = value[0];
    if (first == null || first.match(/[JFMASOND0-9]/) == null) {
      return;
    }
    if (value[value.length - 1].match(/[0-9Z]/) == null) {
      return;
    }
    let timeZone = "UTC";
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {}
    const d = parseFromTimeZone(value, { timeZone });
    if (d.toString() === "Invalid Date") {
      return;
    }
    return d;
  }
}

export type ParserType = Parser;

export const defaultParser = new Parser();
