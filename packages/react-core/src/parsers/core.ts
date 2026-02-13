import { CellType } from '../types';
import { TimeDelta } from '../lib/time';
import { parseDate } from '../lib/date';

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
  any?(value: string, cell?: CellType): string | undefined;
  bool?(value: string, cell?: CellType): boolean | undefined;
  number?(value: string, cell?: CellType): number | undefined;
  timedelta?(value: string, cell?: CellType): TimeDelta | undefined;
  date?(value: string, cell?: CellType): Date | undefined;
}

export class Parser implements ParserMixinType {
  functions!: ((value: string, cell?: CellType) => any)[];
  private condition?: Condition;
  private complement?: Stringify;

  constructor(props?: Props) {
    this.applyMixins(props?.mixins);

    if (!this.functions) {
      this.functions = [
        this.number.bind(this),
        this.timedelta.bind(this),
        this.date.bind(this),
        this.bool.bind(this),
        this.any.bind(this),
      ];
    }

    if (props != null) {
      const { condition, complement } = props;
      this.condition = condition;
      this.complement = complement;
    }
  }

  private applyMixins(mixins?: ParserMixinType[]) {
    if (!mixins) {
      return;
    }

    for (const mixin of mixins) {
      for (const key in mixin) {
        if (key === 'functions' && Array.isArray(mixin.functions)) {
          if (!this.functions) {
            this.functions = [];
          }
          this.functions.push(...mixin.functions);
        } else {
          (this as any)[key] = (mixin as any)[key];
        }
      }
    }
  }

  public call(value: string, cell: CellType): CellType {
    try {
      const parsed = this.parse(value, cell);
      return this.callback(parsed, cell);
    } catch (e) {
      return this.callback(String(e), cell);
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

  any(value: string, cell?: CellType): string | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    return value;
  }

  bool(value: string, cell?: CellType): boolean | undefined {
    return BOOLS[value.toLowerCase()];
  }

  number(value: string, cell?: CellType): number | undefined {
    const m = value.match(/^-?[\d.]+$/);
    if (m != null && value.match(/\.$/) == null && (value.match(/\./g) || []).length <= 1) {
      return parseFloat(value);
    }
  }

  timedelta(value: string, cell?: CellType): TimeDelta | undefined {
    if (value.length < 4 || isNaN(value[value.length - 1] as unknown as number)) {
      return;
    }
    return TimeDelta.parse(value);
  }

  date(value: string, cell?: CellType): Date | undefined {
    return parseDate(value);
  }
}

export type ParserType = Parser;

export const defaultParser = new Parser();
