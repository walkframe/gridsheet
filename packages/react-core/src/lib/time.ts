import dayjs from 'dayjs';

export const defaultTimeDeltaFormat = 'HH:mm:ss';

export const BASE_DATE = new Date('2345-01-02T03:04:05Z');
type DiffFunction = (date: Date | number, amount: number) => Date;
const UNITS = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'] as const;
const ADD_FNS = UNITS.map(
  (unit) => (date: Date, amount: number) => dayjs(date).add(amount, unit).toDate(),
) as DiffFunction[];
const SUB_FNS = UNITS.map(
  (unit) => (date: Date, amount: number) => dayjs(date).subtract(amount, unit).toDate(),
) as DiffFunction[];

type Diff = [number, number, number, number, number, number, number];

export class TimeDelta {
  public gsType = 'TimeDelta';
  protected diff: Diff = [0, 0, 0, 0, 0, 0, 0];
  private date1: Date;
  private date2: Date;
  public format: string;

  constructor(date1: Date, date2: Date, format = defaultTimeDeltaFormat) {
    this.diff = [
      date1.getFullYear() - date2.getFullYear(),
      date1.getMonth() - date2.getMonth(),
      date1.getDate() - date2.getDate(),
      date1.getHours() - date2.getHours(),
      date1.getMinutes() - date2.getMinutes(),
      date1.getSeconds() - date2.getSeconds(),
      date1.getMilliseconds() - date2.getMilliseconds(),
    ];
    this.date1 = date1;
    this.date2 = date2;
    this.format = format;
  }
  public add(date: Date) {
    this.diff.forEach((n, i) => {
      date = ADD_FNS[i](date, n);
    });
    return date;
  }
  public sub(date: Date) {
    this.diff.forEach((n, i) => {
      date = SUB_FNS[i](date, n);
    });
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
    result = result.replace('HH', String(tokens[0]).padStart(2, '0'));
    result = result.replace('H', String(tokens[0]));
    result = result.replace('mm', String(tokens[1]).padStart(2, '0'));
    result = result.replace('ss', String(tokens[2]).padStart(2, '0'));
    result = result.replace('SSS', String(tokens[3]).padStart(3, '0'));
    result = result.replace('SS', String(tokens[3]).padStart(2, '0').substring(0, 2));
    result = result.replace('S', String(tokens[3]).padStart(1, '0').substring(0, 1));
    return result;
  }

  public toJSON() {
    return this.stringify();
  }

  public toString() {
    return this.stringify();
  }

  static create(hours = 0, minutes = 0, seconds = 0, milliseconds = 0) {
    const diff: Diff = [0, 0, 0, hours, minutes, seconds, milliseconds];
    let date = BASE_DATE;
    diff.forEach((n, i) => {
      date = ADD_FNS[i](date, n);
    });
    return new TimeDelta(date, BASE_DATE);
  }

  static is(obj: any): boolean {
    if (obj instanceof TimeDelta) {
      return true;
    }
    if (obj?.gsType === 'TimeDelta') {
      return true;
    }
    return false;
  }

  static ensure(obj: any) {
    if (obj instanceof TimeDelta) {
      return obj;
    }
    if (obj?.gsType === 'TimeDelta') {
      return TimeDelta.fromObject(obj);
    }
    return TimeDelta.create();
  }
  static fromObject(obj: any) {
    return new TimeDelta(new Date(obj.date1), new Date(obj.date2));
  }
  static parse(value: string, format = defaultTimeDeltaFormat, strict = false): TimeDelta | undefined {
    {
      const formattedMatcher = dayjsFormatToNamedRegex(format);
      const match = value.match(formattedMatcher);
      if (match?.groups) {
        return TimeDelta.create(
          Number(match.groups.HH || match.groups.H || 0),
          Number(match.groups.mm || match.groups.m || 0),
          Number(match.groups.ss || match.groups.s || 0),
          Number(match.groups.SSS || match.groups.SS || match.groups.S || 0),
        );
      }
    }
    if (strict) {
      return;
    }
    {
      const match = value.match(/^([+-]?)(\d+):(\d{2})$/);
      if (match) {
        const [, _sign, hours, minutes] = match;
        const sign = _sign === '-' ? -1 : 1;
        return TimeDelta.create(sign * Number(hours), sign * Number(minutes));
      }
    }
    {
      const match = value.match(/^([+-]?)(\d+):(\d{2}):(\d{2})$/);
      if (match) {
        const [, _sign, hours, minutes, seconds] = match;
        const sign = _sign === '-' ? -1 : 1;
        return TimeDelta.create(sign * Number(hours), sign * Number(minutes), sign * Number(seconds));
      }
    }
    {
      const match = value.match(/^([+-]?)(\d+):(\d{2}):(\d{2})\.(\d+)$/);
      if (match) {
        const [, _sign, hours, minutes, seconds, msecs] = match;
        const sign = _sign === '-' ? -1 : 1;
        return TimeDelta.create(
          sign * Number(hours),
          sign * Number(minutes),
          sign * Number(seconds),
          sign * Number(msecs),
        );
      }
    }
  }
}

const tokenRegexMap: Record<string, { group: string; pattern: string }> = {
  HH: { group: 'HH', pattern: '(?<HH>\\d+)' },
  H: { group: 'H', pattern: '(?<HH>\\d+)' },
  mm: { group: 'mm', pattern: '(?<mm>[0-5]\\d)' },
  m: { group: 'm', pattern: '(?<m>\\d|[1-5]\\d)' },
  ss: { group: 'ss', pattern: '(?<ss>[0-5]\\d)' },
  s: { group: 's', pattern: '(?<s>\\d|[1-5]\\d)' },
  SSS: { group: 'SSS', pattern: '(?<SSS>\\d{3})' },
  SS: { group: 'SS', pattern: '(?<SS>\\d{2})' },
  S: { group: 'S', pattern: '(?<S>\\d)' },
};

function dayjsFormatToNamedRegex(format: string): RegExp {
  const sortedTokens = Object.keys(tokenRegexMap).sort((a, b) => b.length - a.length);
  const tokenPattern = new RegExp(sortedTokens.join('|'), 'g');

  const escapedFormat = format.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  const regexSource = escapedFormat.replace(tokenPattern, (match) => {
    return tokenRegexMap[match]?.pattern ?? match;
  });

  return new RegExp(`^${regexSource}$`);
}

export const safeQueueMicrotask =
  typeof queueMicrotask === 'function' ? queueMicrotask : (cb: () => void) => Promise.resolve().then(cb);
