import dayjs from 'dayjs';

import { CellType, PointType, WriterType } from '../types';
import { Table, UserTable } from '../lib/table';
import { solveFormula } from '../formula/solver';
import { FormulaError } from '../formula/evaluator';
import { p2a } from '../lib/converters';
import { TimeDelta } from '../lib/time';

type Condition = (value: any) => boolean;

type Stringify = (value: any) => string;

type Props = {
  condition?: Condition;
  complement?: Stringify;
  mixins?: RendererMixinType[];
};

export interface RendererMixinType {
  render?(value: any, table: UserTable, writer?: WriterType, position?: PointType): any;
  stringify?(cell: CellType): string;
  string?(value: string, table: UserTable, writer?: WriterType, position?: PointType): any;
  bool?(value: boolean, writer?: WriterType, position?: PointType): any;
  number?(value: number, writer?: WriterType, position?: PointType): any;
  date?(value: Date, writer?: WriterType, position?: PointType): any;
  timedelta?(value: TimeDelta, writer?: WriterType, position?: PointType): any;
  array?(value: any[], writer?: WriterType, position?: PointType): any;
  object?(value: any, writer?: WriterType, position?: PointType): any;
  null?(value: null, writer?: WriterType, position?: PointType): any;
  undefined?(value: undefined, writer?: WriterType, position?: PointType): any;
}

export class Renderer implements RendererMixinType {
  public datetimeFormat: string = 'YYYY-MM-DD HH:mm:ss';
  public dateFormat: string = 'YYYY-MM-DD';
  public timeDeltaFormat: string = 'HH:mm:ss';
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
        // @ts-expect-error mixin has the same fields as this
        this[key] = mixin[key];
      }
    }
  }

  public call(table: Table, point: PointType, writer?: WriterType): any {
    const address = p2a(point);
    const cache = table.getSolvedCache(address);
    const value = cache || table.getByPoint(point)?.value;
    return this.render(value, table, writer, point);
  }

  public render(value: any, table: Table, writer?: WriterType, position?: PointType): any {
    if (this.condition && !this.condition(value)) {
      return this.complement ? this.complement(value) : this.stringify({ value });
    }

    switch (typeof value) {
      case 'object':
        if (value instanceof Date) {
          return this.date(value, writer, position);
        }
        if (value instanceof TimeDelta) {
          return this.timedelta(value, writer, position);
        }
        if (value == null) {
          return this.null(value, writer, position);
        }
        if (value instanceof Table) {
          return this.render(value.getByPoint({ y: value.top, x: value.left })?.value, table, writer, position);
        }
        if (Array.isArray(value)) {
          return this.array(value, writer, position);
        }
        if (value instanceof FormulaError) {
          throw value;
        }
        return this.object(value, writer, position);
      case 'string':
        return this.string(value, table, writer, position);
      case 'number':
        return this.number(value, writer, position);
      case 'boolean':
        return this.bool(value, writer, position);
      case 'undefined':
        return this.undefined(value, writer, position);
      case 'function':
        return value() as string;
    }
    return '';
  }

  stringify(cell: CellType, position?: PointType): string {
    const { value } = cell;
    if (value instanceof Date) {
      return this.date(value);
    }
    if (value instanceof TimeDelta) {
      return this.timedelta(value);
    }
    if (value == null) {
      return '';
    }

    return value.toString();
  }

  string(value: string, table: Table, writer?: WriterType, position?: PointType): any {
    if (value[0] === "'") {
      return value.substring(1);
    }
    if (value[0] === '=') {
      const result = solveFormula({ value, table, raise: true });
      if (result === null) {
        return this.null(null);
      }
      if (result === undefined) {
        return this.undefined(undefined);
      }
      if (result.constructor.name === 'Boolean') {
        return String(result).toUpperCase();
      }
      if (result.constructor.name === 'Date') {
        return this.date(result as Date);
      }
      return this.render(result, table, writer);
    }
    return value;
  }

  bool(value: boolean, writer?: WriterType, position?: PointType): any {
    return value ? 'TRUE' : 'FALSE';
  }

  number(value: number, writer?: WriterType, position?: PointType): any {
    if (isNaN(value)) {
      return 'NaN';
    }
    return value;
  }

  date(value: Date, writer?: WriterType, position?: PointType): any {
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return dayjs(value).format(this.dateFormat);
    }
    return dayjs(value).format(this.datetimeFormat);
  }

  timedelta(value: TimeDelta, writer?: WriterType, position?: PointType): any {
    return value.stringify(this.timeDeltaFormat);
  }

  array(value: any[], writer?: WriterType, position?: PointType): any {
    return value.map((v) => this.stringify({ value: v })).join(',');
  }

  object(value: any, writer?: WriterType, position?: PointType): any {
    return JSON.stringify(value);
  }

  null(value: any, writer?: WriterType, position?: PointType): any {
    return '';
  }

  undefined(value: undefined, writer?: WriterType, position?: PointType): any {
    return '';
  }
}

export type RendererType = Renderer;
export const defaultRenderer = new Renderer();
