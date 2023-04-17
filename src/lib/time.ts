import {
  addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds,
  subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds,
} from 'date-fns';

export class TimeDelta {
  private addFns = [addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds];
  private subFns = [subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds];
  private diff = [0, 0, 0, 0, 0, 0, 0];
  
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
  }
  public add(date: Date) {
    this.diff.forEach((n, i) => {
      date = this.addFns[i](date, n);
    })
    return date;
  }
  public sub(date: Date) {
    this.diff.forEach((n, i) => {
      date = this.subFns[i](date, n);
    })
    return date;
  }

  static blank() {
    const now = new Date();
    return new TimeDelta(now, now);
  }
}