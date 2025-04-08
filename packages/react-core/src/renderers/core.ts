import dayjs from 'dayjs';

import { CellType, PointType, WriterType } from '../types';
import { Table, UserTable } from '../lib/table';
import { solveFormula } from '../formula/solver';
import { FormulaError } from '../formula/evaluator';
import { p2a } from '../lib/converters';
import { TimeDelta } from '../lib/time';
import type { RefObject } from 'react';

type Condition = (value: any) => boolean;

type Stringify = (value: any) => string;

type Props = {
  condition?: Condition;
  complement?: Stringify;
  mixins?: RendererMixinType[];
};

export interface CleanupRef extends HTMLDivElement {
  cleanup?: () => void;
}

export type RendererCallProps = {
  table: Table;
  point: PointType;
  writer?: WriterType;
  renderedRef?: RefObject<CleanupRef>;
}

export type RenderProps<T extends any=any> = {
  value: T;
  table: Table;
  point: PointType;
  writer?: WriterType;
  renderedRef?: RefObject<CleanupRef>;
}

export interface RendererMixinType {
  datetimeFormat?: string;
  dateFormat?: string;
  timeDeltaFormat?: string;

  render?(props: RenderProps): any;
  stringify?(cell: CellType, renderProps: RenderProps): string;
  string?(props: RenderProps<string>): any;
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
        // @ts-expect-error mixin has the same fields as this
        this[key] = mixin[key];
      }
    }
  }

  public call({point, table, writer, renderedRef}: RendererCallProps): any {
    const address = p2a(point);
    const key = table.getFullRef(address);
    const alreadyRendered = table.conn.renderedCaches[key];
    if (alreadyRendered !== undefined) {
      return alreadyRendered;
    }
    const cache = table.getSolvedCache(address);

    const cell = table.getByPoint(point);
    let value = cache ?? cell?.value;
    if (typeof value === 'string' && !cell?.disableFormula) {
      if (value[0] === "'") {
        value = value.substring(1);
      } else if (value[0] === '=') {
        value = solveFormula({ value, table, raise: true, origin: point });
      }
    }
    const rendered = this.render({value, table, writer, point, renderedRef});
    table.conn.renderedCaches[key] = rendered;
    return rendered;

  }

  public render(props: RenderProps): any {
    const { value, table, writer, point } = props;
    if (this.condition && !this.condition(value)) {
      return this.complement ? this.complement(value) : this.stringify({ value }, props);
    }

    if (value == null) {
      return this.null(props);
    }

    switch (typeof value) {
      case 'object':
        if (value instanceof Date) {
          return this.date(props);
        }
        if (TimeDelta.is(value)) {
          return this.timedelta({...props, value: TimeDelta.ensure(value)});
        }
        if (value instanceof Table) {
          // MAY: { y: value.top, x: value.left } ?
          const cell = table.getByPoint(point);
          return this.render({...props, value: cell?.value});
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

  stringify(cell: CellType, renderProps: RenderProps): string {
    const { value } = cell;
    const { table, point } = renderProps;
    if (value instanceof Date) {
      return this.date({value, table, point});
    }
    if (TimeDelta.is(value)) {
      return this.timedelta({value: TimeDelta.ensure(value), table, point});
    }
    if (value == null) {
      return '';
    }
    return value.toString();
  }


  string({ value }: RenderProps<string>): any {
    return value;
  }

  bool({value}: RenderProps<boolean>): any {
    return value ? 'TRUE' : 'FALSE';
  }

  number({value}: RenderProps<number>): any {
    if (isNaN(value)) {
      return 'NaN';
    }
    return value;
  }

  date({value}: RenderProps<Date>): any {
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return dayjs(value).format(this.dateFormat);
    }
    return dayjs(value).format(this.datetimeFormat);
  }

  timedelta({value}: RenderProps<TimeDelta>) {
    return value.stringify(this.timeDeltaFormat);
  }

  array(props: RenderProps<any[]>): any {
    const { value } = props;
    return value.map((v) => this.stringify({ value: v }, props)).join(',');
  }

  object({value}: RenderProps<any>): any {
    return JSON.stringify(value);
  }

  null({}: RenderProps<null | undefined>): any {
    return '';
  }
}

export type RendererType = Renderer;
export const defaultRenderer = new Renderer();
