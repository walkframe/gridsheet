import { parseFromTimeZone } from 'date-fns-timezone';
import { CellType } from '../types';
import { TimeDelta } from '../lib/time';

type Condition = (value: string) => boolean;
type Stringify = (value: string) => any;

type Props = {
  condition?: Condition;
  complement?: Stringify;
  mixins?: ParserMixinType[];
};

const BOOLS = { true: true, false: false } as { [s: string]: boolean };

export interface ParserMixinType {
  functions?: ((value: string, cell?: CellType) => any)[];
  callback?(parsed: any, cell?: CellType): CellType;
  parse?(value: string, cell: CellType): any;
  bool?(value: string, cell?: CellType): boolean | undefined;
  number?(value: string, cell?: CellType): number | undefined;
  timedelta?(value: string, cell?: CellType): TimeDelta | undefined;
  date?(value: string, cell?: CellType): Date | undefined;
}

export class Parser implements ParserMixinType {
  functions: ((value: string, cell?: CellType) => any)[] = [
    this.number.bind(this),
    this.timedelta.bind(this),
    this.date.bind(this),
    this.bool.bind(this),
  ];

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

  private applyMixins(mixins?: ParserMixinType[]) {
    if (mixins == null) {
      return;
    }
    for (const mixin of mixins) {
      for (const key in mixin) {
        // @ts-expect-error mixin has the same fields as this
        this[key] = mixin[key];
      }
    }
  }
  public call(value: string, cell: CellType): CellType {
    try {
      const parsed = this.parse(value, cell);
      return this.callback(parsed, cell);
    } catch (e) {
      return this.callback(e, cell);
    }
  }
  public callback(parsed: any, cell?: CellType): CellType {
    return { ...cell, value: parsed };
  }
  public parse(value: string, cell?: CellType): any {
    if (this.condition && !this.condition(value)) {
      const result = this.complement ? this.complement(value) : value;
      return result;
    }
    if (value[0] === "'") {
      return value;
    }
    for (let i = 0; i < this.functions.length; i++) {
      const result = this.functions[i](value, cell);
      if (result != null) {
        return result;
      }
    }
    if (value === '') {
      return null;
    }
    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bool(value: string, cell?: CellType): boolean | undefined {
    return BOOLS[value.toLowerCase()];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  number(value: string, cell?: CellType): number | undefined {
    const m = value.match(/^-?[\d.]+$/);
    if (m != null && value.match(/\.$/) == null && (value.match(/\./g) || []).length <= 1) {
      return parseFloat(value);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timedelta(value: string, cell?: CellType): TimeDelta | undefined {
    if (value.length < 4 || isNaN(value[value.length - 1] as unknown as number)) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  date(value: string, cell?: CellType): Date | undefined {
    const first = value[0];
    if (first == null || first.match(/[JFMASOND0-9]/) == null) {
      return;
    }
    if (value[value.length - 1].match(/[0-9Z]/) == null) {
      return;
    }
    let timeZone = 'UTC';
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      // eslint-disable-next-line no-empty
    }
    const d = parseFromTimeZone(value, { timeZone });
    if (d.toString() === 'Invalid Date') {
      return;
    }
    return d;
  }
}

export type ParserType = Parser;

export const defaultParser = new Parser();
