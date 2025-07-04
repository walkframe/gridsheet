import dayjs from 'dayjs';

import { CellType, PointType, WriterType } from '../types';
import { Table, UserTable } from '../lib/table';
import { solveFormula, solveTable } from '../formula/solver';
import { FormulaError } from '../formula/evaluator';
import { TimeDelta } from '../lib/time';
import { stripTable } from '../formula/solver';

type Condition = (value: any) => boolean;

type Stringify = (value: any) => string;

export type Props = {
  condition?: Condition;
  complement?: Stringify;
  mixins?: RendererMixinType[];
};

export type RendererCallProps = {
  table: Table;
  point: PointType;
  sync?: (table: UserTable) => void;
};

export type RenderProps<T extends any = any> = {
  value: T;
  cell?: CellType<T>;
  table: Table;
  point: PointType;
  sync?: (table: UserTable) => void;
};

export interface RendererMixinType {
  datetimeFormat?: string;
  dateFormat?: string;
  timeDeltaFormat?: string;

  decorate?(rendered: any, props: RenderProps): any;
  render?(props: RenderProps): any;
  stringify?(props: RenderProps): string;
  string?(props: RenderProps<string>): any;
  table?(props: RenderProps<Table>): any;
  bool?(props: RenderProps<boolean>): any;
  number?(props: RenderProps<number>): any;
  date?(props: RenderProps<Date>): any;
  timedelta?(props: RenderProps<TimeDelta>): any;
  array?(props: RenderProps<any[]>): any;
  object?(props: RenderProps<any>): any;
  null?(props: RenderProps<null | undefined>): any;
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
        (this as any)[key] = (mixin as any)[key];
      }
    }
  }

  public call(props: RendererCallProps): any {
    const { point: origin, table, sync } = props;
    const key = table.getId(origin);
    const cell = table.getById(key) ?? {};
    const cache = table.getSolvedCache(origin);
    let value = cache;
    if (cache === undefined) {
      if (typeof cell?.value === 'string' && !cell?.disableFormula) {
        if (cell.value[0] === "'") {
          value = cell.value.substring(1);
        } else {
          value = solveFormula({ value: cell.value, table, raise: true, origin });
        }
      } else {
        value = cell?.value;
      }
    }
    const rendered = this.render({ value, cell, table, sync, point: origin });
    return this.decorate(rendered, { ...props, value, cell });
  }

  public decorate(rendered: any, props: RenderProps): any {
    return rendered;
  }

  public render(props: RenderProps): any {
    const { cell, table, point } = props;
    const value = props.value;

    if (this.condition && !this.condition(value)) {
      return this.complement ? this.complement(value) : this.stringify(props);
    }
    if (value == null) {
      return this.null(props);
    }

    switch (typeof value) {
      case 'object':
        if (value instanceof Table) {
          return this.table(props);
        }
        if (value instanceof Date) {
          return this.date(props);
        }
        if (TimeDelta.is(value)) {
          return this.timedelta({ value: TimeDelta.ensure(value), cell, table, point });
        }
        if (Array.isArray(value)) {
          return this.array(props);
        }
        if (value instanceof FormulaError) {
          throw value;
        }
        return this.object(props);
      case 'string':
        return this.string(props);
      case 'number':
        return this.number(props);
      case 'boolean':
        return this.bool(props);
      case 'function':
        return value() as string;
    }
    return '';
  }

  stringify({ value, cell, table, point }: RenderProps): string {
    if (value === undefined) {
      value = cell?.value;
    }
    if (value instanceof Date) {
      return this.date({ value, cell, table, point });
    }
    if (TimeDelta.is(value)) {
      const ensured = TimeDelta.ensure(value);
      return this.timedelta({ value: ensured, cell: { ...cell, value: ensured }, table, point });
    }
    if (value == null) {
      return '';
    }
    if (value instanceof FormulaError) {
      return '';
    }
    if (value instanceof Error) {
      return '';
    }
    return value.toString();
  }

  string({ value }: RenderProps<string>): any {
    return value!;
  }

  table(props: RenderProps<Table>): any {
    let { value: table } = props;
    const value = stripTable({ value: table });
    return this.render({ ...props, table, value });
  }

  bool({ value }: RenderProps<boolean>): any {
    return value ? 'TRUE' : 'FALSE';
  }

  number({ value }: RenderProps<number>): any {
    if (isNaN(value!)) {
      return 'NaN';
    }
    return value;
  }

  date({ value }: RenderProps<Date>): any {
    if (value!.getHours() + value!.getMinutes() + value!.getSeconds() === 0) {
      return dayjs(value).format(this.dateFormat);
    }
    return dayjs(value).format(this.datetimeFormat);
  }

  timedelta({ value }: RenderProps<TimeDelta>) {
    return value!.stringify(this.timeDeltaFormat);
  }

  array(props: RenderProps<any[]>): any {
    let { value } = props;
    return value!.map((v) => this.stringify(props)).join(',');
  }

  object({ value }: RenderProps<any>): any {
    return JSON.stringify(value);
  }

  null({}: RenderProps<null | undefined>): any {
    return '';
  }
}

export type RendererType = Renderer;
export const defaultRenderer = new Renderer();
