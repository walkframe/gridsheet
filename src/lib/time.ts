import {
  addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds,
  subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds,
} from 'date-fns';

export const BASE_DATE = new Date('2345-01-02T03:04:05Z');
type DiffFunction = (date: Date | number, amount: number) => Date;
const ADD_FNS = [addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds] as DiffFunction[];
const SUB_FNS = [subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds] as DiffFunction[];

type Diff = [number, number, number, number, number, number, number];

export class TimeDelta {
  protected diff: Diff = [0, 0, 0, 0, 0, 0, 0];
  private date1: Date;
  private date2: Date;
  public format: string;
  
  constructor (date1: Date, date2: Date) {
    this.diff = [
      (date1.getFullYear() - date2.getFullYear()),
      (date1.getMonth() - date2.getMonth()),
      (date1.getDate() - date2.getDate()),
      (date1.getHours() - date2.getHours()),
      (date1.getMinutes() - date2.getMinutes()),
      (date1.getSeconds() - date2.getSeconds()),
      (date1.getMilliseconds() - date2.getMilliseconds()),
    ];
    this.date1 = date1;
    this.date2 = date2;
    this.format = "HH:mm";
  }
  public add(date: Date) {
    this.diff.forEach((n, i) => {
      date = ADD_FNS[i](date, n);
    })
    return date;
  }
  public sub(date: Date) {
    this.diff.forEach((n, i) => {
      date = SUB_FNS[i](date, n);
    })
    return date;
  }

  public stringify(format?: string) {
    if (format == null) {
      format = this.format;
    }
    const tokens = [];
    const msecs = this.date1.getMilliseconds() - this.date2.getMilliseconds();
    let secs = (this.date1.getTime() - this.date2.getTime()) / 1000;
    for (const divider of [3600, 60]) {
      tokens.push(Math.floor(secs / divider));
      secs %= divider;
    }
    tokens.push(secs, msecs);
    let result = format;
    result = result.replace("HH", String(tokens[0]).padStart(2, '0'));
    result = result.replace("H", String(tokens[0]));
    result = result.replace("mm", String(tokens[1]).padStart(2, '0'));
    result = result.replace("ss", String(tokens[2]).padStart(2, '0'));
    result = result.replace("SSS", String(tokens[3]).padStart(3, '0'));
    result = result.replace("SS", String(tokens[3]).padStart(2, '0').substring(0, 2));
    result = result.replace("S", String(tokens[3]).padStart(1, '0').substring(0, 1));
    return result;
  }

  public toJSON() {
    return this.stringify();
  }

  public toString() {
    return this.stringify();
  }

  static create(hours=0, minutes=0, seconds=0, milliseconds=0) {
    const diff: Diff = [0, 0, 0, hours, minutes, seconds, milliseconds];
    let date = BASE_DATE;
    diff.forEach((n, i) => {
      date = (ADD_FNS[i])(date, n);
    })
    return new TimeDelta(date, BASE_DATE);
  }
}