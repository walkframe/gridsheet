import { parseFromTimeZone, formatToTimeZone } from "date-fns-timezone";

export class Parser {
  protected value: string;
  protected parseFunctions: ((value: string) => any)[] = [
    this.number,
    this.date,
    this.bool,
  ];

  constructor(value: string) {
    this.value = value;
  }

  public parse (): any {
    for (let i = 0; i < this.parseFunctions.length; i++) {
      const result = this.parseFunctions[i](this.value);
      if (result != null) {
        return result;
      }
    }
    return this.value;
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
    const m = value.match(/^[\d.]+$/);
    if (m != null) {
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

