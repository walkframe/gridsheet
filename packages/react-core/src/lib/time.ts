import { BASE_DATE } from '../constants';

const MS_PER_DAY = 86400000;

export class Time {
  public readonly __gsType = 'Time' as const;
  public readonly days: number;
  public format: string;

  constructor(days: number, format = 'HH:mm:ss') {
    this.days = days;
    this.format = format;
  }

  public add(date: Date): Date {
    return new Date(date.getTime() + this.days * MS_PER_DAY);
  }

  public sub(date: Date): Date {
    return new Date(date.getTime() - this.days * MS_PER_DAY);
  }

  public stringify(format?: string): string {
    const totalMs = this.toMilliseconds();
    const absMs = Math.abs(totalMs);
    const sign = totalMs < 0 ? '-' : '';

    const millis = absMs % 1000;
    let remaining = Math.floor(absMs / 1000);
    const seconds = remaining % 60;
    remaining = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    const hours = Math.floor(remaining / 60);

    const resolvedFormat = format ?? (millis === 0 ? 'HH:mm:ss' : 'HH:mm:ss.SSS');

    let result = resolvedFormat;
    result = result.replace('HH', sign + String(hours).padStart(2, '0'));
    result = result.replace('H', sign + String(hours));
    result = result.replace('mm', String(minutes).padStart(2, '0'));
    result = result.replace('ss', String(seconds).padStart(2, '0'));
    result = result.replace('SSS', String(millis).padStart(3, '0'));
    result = result.replace('SS', String(millis).padStart(3, '0').substring(0, 2));
    result = result.replace('S', String(millis).padStart(3, '0').substring(0, 1));
    return result;
  }

  public toMilliseconds(): number {
    return this.days * MS_PER_DAY;
  }

  public toDate(): Date {
    return new Date(BASE_DATE.getTime() + this.days * MS_PER_DAY);
  }

  public toJSON(): { __gsType: 'Time'; days: number; format: string } {
    return { __gsType: 'Time', days: this.days, format: this.format };
  }

  public toString(): string {
    return this.stringify();
  }

  static create(hours = 0, minutes = 0, seconds = 0, milliseconds = 0): Time {
    const ms = hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    return new Time(ms / MS_PER_DAY);
  }

  static fromDate(date: Date): Time {
    const timeMs =
      date.getHours() * 3600000 + date.getMinutes() * 60000 + date.getSeconds() * 1000 + date.getMilliseconds();
    return new Time(timeMs / MS_PER_DAY);
  }

  static fromDates(date1: Date, date2: Date): Time {
    return new Time((date1.getTime() - date2.getTime()) / MS_PER_DAY);
  }

  static fromObject(obj: { days: number; format?: string }): Time {
    return new Time(obj.days, obj.format);
  }

  static is(obj: any): boolean {
    if (obj instanceof Time) {
      return true;
    }
    if (obj?.__gsType === 'Time') {
      return true;
    }
    return false;
  }

  static ensure(obj: any): Time {
    if (obj instanceof Time) {
      return obj;
    }
    if (obj?.__gsType === 'Time') {
      return Time.fromObject(obj);
    }
    return Time.create();
  }

  static parse(value: string, format?: string, strict = false): Time | undefined {
    if (format != null) {
      const formattedMatcher = dayjsFormatToNamedRegex(format);
      const match = value.match(formattedMatcher);
      if (match?.groups) {
        return Time.create(
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
        return Time.create(sign * Number(hours), sign * Number(minutes));
      }
    }
    {
      const match = value.match(/^([+-]?)(\d+):(\d{2}):(\d{2})$/);
      if (match) {
        const [, _sign, hours, minutes, seconds] = match;
        const sign = _sign === '-' ? -1 : 1;
        return Time.create(sign * Number(hours), sign * Number(minutes), sign * Number(seconds));
      }
    }
    {
      const match = value.match(/^([+-]?)(\d+):(\d{2}):(\d{2})\.(\d+)$/);
      if (match) {
        const [, _sign, hours, minutes, seconds, msecs] = match;
        const sign = _sign === '-' ? -1 : 1;
        return Time.create(sign * Number(hours), sign * Number(minutes), sign * Number(seconds), sign * Number(msecs));
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
