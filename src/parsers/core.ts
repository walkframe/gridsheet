import { parseFromTimeZone } from "date-fns-timezone";

type Condition = (value: string) => boolean;
type Stringify = (value: string) => any;

type Props = {
  condition?: Condition;
  complement?: Stringify;
}

export class Parser {
  protected parseFunctions: ((value: string) => any)[] = [
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

  public callback(parsed: any, before?: any): any {
    return parsed;
  }

  public parse (value: string, before?: any): any {
    console.log(0, value);
    if (this.condition && !this.condition(value)) {
      const result = this.complement ? this.complement(value) : value;
      return this.callback(result, before);
    }
    console.log(1, value);

    if (value[0] === "'") {
      return this.callback(value, before);
    }
    console.log(2, value);
    for (let i = 0; i < this.parseFunctions.length; i++) {
      const result = this.parseFunctions[i](value);
      if (result != null) {
        return this.callback(result, before);
      }
    }
    console.log(3, value);
    return this.callback(value, before);
  }

  protected bool (value: string): boolean | undefined {
    if (value.match(/^true$/i)) {
      return true;
    }
    if (value.match(/^false$/i)) {
      return false;
    }
  }

  protected number (value: string): number | undefined {
    const m = value.match(/^-?[\d.]+$/);
    if (m != null && value.match(/\.$/) == null && (value.match(/\./g) || []).length <= 1) {
      return parseFloat(value);
    }
  }

  protected date (value: string): Date | undefined {
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
};

export type ParserType = Parser;

export const defaultParser = new Parser();
