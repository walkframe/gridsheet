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

export type Props = {
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
  cell: CellType<T>;
  table: Table;
  point: PointType;
  writer?: WriterType;
  renderedRef?: RefObject<CleanupRef>;
}

export interface RendererMixinType {
  datetimeFormat?: string;
  dateFormat?: string;
  timeDeltaFormat?: string;

  decorate?(rendered: any, props: RenderProps): any;
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

  public call(props: RendererCallProps): any {
    const {point, table, writer, renderedRef} = props
    const address = p2a(point);
    const key = table.getFullRef(address);
    const alreadyRendered = table.conn.renderedCaches[key];
    const cell = table.getByPoint(point)!;
    if (alreadyRendered !== undefined) {
      return this.decorate(alreadyRendered, {...props, cell});
      return alreadyRendered;
    }
    const cache = table.getSolvedCache(address);


    let value = cache ?? cell?.value;
    if (typeof value === 'string' && !cell?.disableFormula) {
      if (value[0] === "'") {
        value = value.substring(1);
      } else if (value[0] === '=') {
        value = solveFormula({ value, table, raise: true, origin: point });
      }
    }
    const rendered = this.render({cell: {...cell, value}, table, writer, point, renderedRef});
    table.conn.renderedCaches[key] = rendered;
    return this.decorate(rendered, {...props, cell});
  }

  public decorate(rendered: any, props: RenderProps): any {
    return rendered;
  }

  public render(props: RenderProps): any {
    const { cell, table, point } = props;
    const value = cell.value;
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
          return this.timedelta({cell: {...cell, value: TimeDelta.ensure(value)}, table, point});
        }
        if (value instanceof Table) {
          // MAY: { y: value.top, x: value.left } ?
          const cell = table.getByPoint(point)!;
          return this.render({...props, cell});
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

  stringify(cell: CellType<any>, renderProps: RenderProps): string {
    const value = cell.value!;
    const { table, point } = renderProps;
    if (value instanceof Date) {
      return this.date({cell, table, point});
    }
    if (TimeDelta.is(value)) {
      return this.timedelta({cell: {...cell, value: TimeDelta.ensure(value)}, table, point});
    }
    if (value == null) {
      return '';
    }
    return value.toString();
  }


  string({ cell }: RenderProps<string>): any {
    return cell.value!;
  }

  bool({cell}: RenderProps<boolean>): any {
    return cell.value ? 'TRUE' : 'FALSE';
  }

  number({cell}: RenderProps<number>): any {
    const { value } = cell!;
    if (isNaN(value!)) {
      return 'NaN';
    }
    return value;
  }

  date({cell}: RenderProps<Date>): any {
    const value = cell!.value!;
    if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
      return dayjs(value).format(this.dateFormat);
    }
    return dayjs(value).format(this.datetimeFormat);
  }

  timedelta({cell}: RenderProps<TimeDelta>) {
    const value = cell.value!;
    return value.stringify(this.timeDeltaFormat);
  }

  array(props: RenderProps<any[]>): any {
    const { cell } = props;
    return cell.value!.map((v) => this.stringify({ value: v }, props)).join(',');
  }

  object({cell}: RenderProps<any>): any {
    return JSON.stringify(cell.value);
  }

  null({}: RenderProps<null | undefined>): any {
    return '';
  }
}

export type RendererType = Renderer;
export const defaultRenderer = new Renderer();
