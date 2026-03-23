import type { FC, ReactNode } from 'react';
import type { CellPatchType, CellType, OperationType, PointType } from '../types';
import type { Sheet, UserSheet } from '../lib/sheet';
import { isSheet } from '../formula/functions/__base';
import dayjs from 'dayjs';
import { FormulaError } from '../formula/formula-error';
import { Pending } from '../sentinels';
import { Time } from '../lib/time';
import { parseDate } from '../lib/date';

export type AutocompleteOption = {
  value: any;
  label?: any;
  keywords?: string[];
  tooltip?: ReactNode | FC<{ value?: any }>;
};

export type SelectProps = {
  sheet: UserSheet;
  point: PointType;
  current?: CellType;
  next?: CellType;
  operation: OperationType;
};

export type SerializeForClipboardProps = {
  sheet: UserSheet;
  point: PointType;
};

export type SelectFallbackProps = {
  sheet: UserSheet;
  point: PointType;
  value: any;
};

export type Scalar = string | number | boolean | null | undefined;

export type ScalarProps<T = any> = {
  value?: T;
  cell?: CellType<T>;
  sheet: Sheet;
  point: PointType;
};

export type RenderProps<T = any> = {
  value?: T;
  cell?: CellType<T>;
  sheet: Sheet;
  point: PointType;
  sync?: (sheet: UserSheet) => void;
};

export type SerializeProps<T = any> = {
  value: T;
  cell?: CellType<T>;
  sheet: Sheet;
  point: PointType;
};

export type PolicyMixinType = {
  // format settings
  datetimeFormat?: string;
  dateFormat?: string;
  timeFormat?: string;
  decimalPrecision?: number;

  // render
  render?: (props: RenderProps) => any;
  renderCallback?: (rendered: any, props: RenderProps) => any;
  renderString?: (props: RenderProps<string>) => any;
  renderNumber?: (props: RenderProps<number>) => any;
  renderBool?: (props: RenderProps<boolean>) => any;
  renderDate?: (props: RenderProps<Date>) => any;
  renderTime?: (props: RenderProps<Time>) => any;
  renderArray?: (props: RenderProps<any[]>) => any;
  renderObject?: (props: RenderProps<any>) => any;
  renderNull?: (props: RenderProps<null | undefined>) => any;
  renderSheet?: (props: RenderProps<Sheet>) => any;
  renderRowHeaderLabel?: (n: number) => string | null;
  renderColHeaderLabel?: (n: number) => string | null;

  // serialize
  serialize?: (props: SerializeProps) => string;
  serializeString?: (props: SerializeProps<string>) => string;
  serializeNumber?: (props: SerializeProps<number>) => string;
  serializeBool?: (props: SerializeProps<boolean>) => string;
  serializeDate?: (props: SerializeProps<Date>) => string;
  serializeTime?: (props: SerializeProps<Time>) => string;
  serializeArray?: (props: SerializeProps<any[]>) => string;
  serializeNull?: (props: SerializeProps<null | undefined>) => string;
  serializeFormulaError?: (props: SerializeProps<FormulaError>) => string;
  serializeError?: (props: SerializeProps<Error>) => string;

  // deserialize
  deserialize?: (value: string, cell?: CellType) => CellType;
  deserializeRaw?: (value: any, cell?: CellType) => CellType;
  deserializeCallback?: (parsed: any, cell?: CellType) => CellType;
  // Priority slot: called before built-in deserializers when defined
  deserializeFirst?: (value: string, cell?: CellType) => CellPatchType<any>;
  // Built-in deserializers
  deserializeNumber?: (value: string, cell?: CellType) => CellPatchType<number | undefined>;
  deserializeBool?: (value: string, cell?: CellType) => CellPatchType<boolean | undefined>;
  deserializeDate?: (value: string, cell?: CellType) => CellPatchType<Date | undefined>;
  deserializeTime?: (value: string, cell?: CellType) => CellPatchType<Time | undefined>;
  deserializeAny?: (value: string, cell?: CellType) => CellPatchType<string | undefined>;

  // toScalar
  toScalar?: (props: ScalarProps) => Scalar;
  toScalarString?: (props: ScalarProps<string>) => Scalar;
  toScalarNumber?: (props: ScalarProps<number>) => Scalar;
  toScalarBool?: (props: ScalarProps<boolean>) => Scalar;
  toScalarDate?: (props: ScalarProps<Date>) => Scalar;
  toScalarTime?: (props: ScalarProps<Time>) => Scalar;
  toScalarArray?: (props: ScalarProps<any[]>) => Scalar;
  toScalarNull?: (props: ScalarProps<null | undefined>) => Scalar;

  // select
  getSelectOptions?: () => AutocompleteOption[];
  getSelectFallback?: (props: SelectFallbackProps) => CellType | undefined;
  select?: (props: SelectProps) => CellType | undefined;
  serializeForClipboard?: (props: SerializeForClipboardProps) => string;
};

type PolicyProps = {
  mixins?: PolicyMixinType[];
  priority?: number;
};

const BOOLS = { true: true, false: false } as { [s: string]: boolean };

export class Policy implements PolicyMixinType {
  public priority: number = 0;

  public datetimeFormat: string = 'YYYY-MM-DD HH:mm:ss';
  public dateFormat: string = 'YYYY-MM-DD';
  public timeFormat: string = 'HH:mm:ss';
  public decimalPrecision: number = 15;

  public deserializeFunctions: ((value: string, cell?: CellType) => CellPatchType<any>)[] = [];
  public deserializeCallback?: (parsed: any, cell?: CellType) => CellType;
  public deserializeFirst?: (value: string, cell?: CellType) => CellPatchType<any>;
  public renderCallback?: (rendered: any, props: RenderProps) => any;

  constructor(props?: PolicyProps) {
    this.priority = props?.priority ?? 1;
    this.applyMixins(props?.mixins);

    this.registerDeserializeFunctions();
  }

  private registerDeserializeFunctions(): void {
    this.deserializeFunctions = [
      ...(this.deserializeFirst ? [this.deserializeFirst.bind(this)] : []),
      this.deserializeNumber.bind(this),
      this.deserializeTime.bind(this),
      this.deserializeDate.bind(this),
      this.deserializeBool.bind(this),
      this.deserializeAny.bind(this),
    ];
  }

  private applyMixins(mixins?: PolicyMixinType[]) {
    if (mixins == null) {
      return;
    }
    const subclassProto = Object.getPrototypeOf(this);
    for (const mixin of mixins) {
      for (const key in mixin) {
        // Methods defined in a subclass take priority over mixins
        const overriddenBySubclass =
          subclassProto !== Policy.prototype && Object.prototype.hasOwnProperty.call(subclassProto, key);
        if (!overriddenBySubclass) {
          (this as any)[key] = (mixin as any)[key];
        }
      }
    }
  }

  // --- RENDER ---

  public render(props: RenderProps): any {
    let { value, cell } = props;
    const { sheet, point } = props;

    // Cell lookup: if cell not provided, resolve from sheet (entry-point usage)
    if (cell == null) {
      cell = sheet.getCell(point, { resolution: 'RESOLVED', raise: true }) ?? {};
      value = cell.value;
    }

    let rendered: any;

    if (Pending.is(value)) {
      rendered = '';
    } else if (value == null) {
      rendered = this.renderNull({ ...props, value: value as null | undefined, cell });
    } else {
      switch (typeof value) {
        case 'object':
          if (value instanceof Date) {
            rendered = this.renderDate({ ...props, value, cell });
          } else if (Time.is(value)) {
            rendered = this.renderTime({ value: Time.ensure(value), cell, sheet, point });
          } else if (Array.isArray(value)) {
            rendered = this.renderArray({ ...props, value, cell });
          } else if (FormulaError.is(value)) {
            throw value;
          } else if (isSheet(value)) {
            rendered = this.renderSheet({ ...props, value, cell });
          } else {
            rendered = this.renderObject({ ...props, value, cell });
          }
          break;
        case 'string':
          rendered = this.renderString({ ...props, value, cell });
          break;
        case 'number':
          rendered = this.renderNumber({ ...props, value, cell });
          break;
        case 'boolean':
          rendered = this.renderBool({ ...props, value, cell });
          break;
        case 'function':
          rendered = (value as () => any)();
          break;
        default:
          rendered = '';
      }
    }

    return this.renderCallback ? this.renderCallback(rendered, { ...props, value, cell }) : rendered;
  }

  public renderString({ value }: RenderProps<string>): any {
    return value!;
  }

  public renderBool({ value }: RenderProps<boolean>): any {
    return value ? 'TRUE' : 'FALSE';
  }

  public renderNumber({ value }: RenderProps<number>): any {
    if (isNaN(value!)) {
      return 'NaN';
    }
    return parseFloat(value!.toPrecision(this.decimalPrecision));
  }

  public renderDate({ value }: RenderProps<Date>): any {
    if (value!.getHours() + value!.getMinutes() + value!.getSeconds() === 0) {
      return dayjs(value).format(this.dateFormat);
    }
    return dayjs(value).format(this.datetimeFormat);
  }

  public renderTime({ value }: RenderProps<Time>): any {
    return value!.stringify(this.timeFormat);
  }

  public renderArray(props: RenderProps<any[]>): any {
    let { value, cell } = props;
    value = value?.[0];
    if (Array.isArray(value)) {
      value = value[0];
    }
    return this.render({ ...props, value, cell });
  }

  public renderObject({ value }: RenderProps<any>): any {
    return JSON.stringify(value);
  }

  public renderNull(_props: RenderProps<null | undefined>): any {
    return '';
  }

  public renderSheet({ value, ...rest }: RenderProps<Sheet>): any {
    const stripped = value!.strip({ raise: false });
    return this.render({ ...rest, value: stripped });
  }

  public renderRowHeaderLabel(_n: number): string | null {
    return null;
  }

  public renderColHeaderLabel(_n: number): string | null {
    return null;
  }

  // --- TO SCALAR ---

  public toScalar(props: ScalarProps): Scalar {
    const { value, cell, sheet, point } = props;
    if (Pending.is(value)) {
      return undefined;
    }
    if (value == null) {
      return this.toScalarNull({ value: value as null | undefined, cell, sheet, point });
    }
    switch (typeof value) {
      case 'string':
        return this.toScalarString({ value, cell, sheet, point });
      case 'number':
        return this.toScalarNumber({ value, cell, sheet, point });
      case 'boolean':
        return this.toScalarBool({ value, cell, sheet, point });
      case 'object':
        if (value instanceof Date) {
          return this.toScalarDate({ value, cell, sheet, point });
        } else if (Time.is(value)) {
          return this.toScalarTime({ value: Time.ensure(value), cell, sheet, point });
        } else if (Array.isArray(value)) {
          return this.toScalarArray({ value, cell, sheet, point });
        } else if (FormulaError.is(value)) {
          throw value;
        }
        return undefined;
      default:
        return undefined;
    }
  }

  public toScalarString({ value }: ScalarProps<string>): Scalar {
    return value;
  }

  public toScalarNumber({ value }: ScalarProps<number>): Scalar {
    return value?.toPrecision(this.decimalPrecision);
  }

  public toScalarBool({ value }: ScalarProps<boolean>): Scalar {
    return value;
  }

  public toScalarDate({ value }: ScalarProps<Date>): Scalar {
    if (value!.getHours() + value!.getMinutes() + value!.getSeconds() === 0) {
      return dayjs(value).format(this.dateFormat);
    }
    return dayjs(value).format(this.datetimeFormat);
  }

  public toScalarTime({ value }: ScalarProps<Time>): Scalar {
    return value!.stringify(this.timeFormat);
  }

  public toScalarArray({ value, cell, sheet, point }: ScalarProps<any[]>): Scalar {
    let v = value?.[0];
    if (Array.isArray(v)) {
      v = v[0];
    }
    return this.toScalar({ value: v, cell, sheet, point });
  }

  public toScalarNull(_props: ScalarProps<null | undefined>): Scalar {
    return null;
  }

  // --- SERIALIZE ---

  public serialize({ value, cell, sheet, point }: SerializeProps): string {
    if (value === undefined) {
      value = cell?.value;
    }
    if (Pending.is(value)) {
      return '';
    }
    if (value instanceof Date) {
      return this.serializeDate({ value, cell, sheet, point } as SerializeProps<Date>);
    }
    if (Time.is(value)) {
      return this.serializeTime({ value: Time.ensure(value), cell, sheet, point } as SerializeProps<Time>);
    }
    if (value == null) {
      return this.serializeNull({ cell, sheet, point } as SerializeProps<null | undefined>);
    }
    if (Array.isArray(value)) {
      return this.serializeArray({ value, cell, sheet, point } as SerializeProps<any[]>);
    }
    if (value instanceof FormulaError) {
      return this.serializeFormulaError({ value, cell, sheet, point } as SerializeProps<FormulaError>);
    }
    if (value instanceof Error) {
      return this.serializeError({ value, cell, sheet, point } as SerializeProps<Error>);
    }
    return value.toString();
  }

  public serializeString({ value }: SerializeProps<string>): string {
    return value;
  }

  public serializeBool({ value }: SerializeProps<boolean>): string {
    return value ? 'true' : 'false';
  }

  public serializeNumber({ value }: SerializeProps<number>): string {
    if (isNaN(value)) {
      return 'NaN';
    }
    return parseFloat(value.toPrecision(this.decimalPrecision)).toString();
  }

  public serializeDate({ value }: SerializeProps<Date>): string {
    if (value!.getHours() + value!.getMinutes() + value!.getSeconds() === 0) {
      return dayjs(value).format(this.dateFormat);
    }
    return dayjs(value).format(this.datetimeFormat);
  }

  public serializeTime({ value }: SerializeProps<Time>): string {
    return value.stringify(this.timeFormat);
  }

  public serializeArray(props: SerializeProps<any[]>): string {
    let { value } = props;
    value = value?.[0];
    if (Array.isArray(value)) {
      value = value[0];
    }
    return this.serialize({ ...props, value });
  }

  public serializeNull(_props: SerializeProps<null | undefined>): string {
    return '';
  }

  public serializeFormulaError({ value }: SerializeProps<FormulaError>): string {
    return value.code;
  }

  public serializeError(_props: SerializeProps<Error>): string {
    return '';
  }

  public serializeForClipboard(props: SerializeForClipboardProps): string {
    const { point, sheet } = props;
    return sheet.getSerializedValue({ point }) ?? '';
  }

  // --- DESERIALIZE ---
  public deserializeValue(value: any, cell: CellType): CellType {
    try {
      const parsed = typeof value !== 'string' ? this.deserializeRaw(value, cell) : this.deserialize(value, cell);
      if (this.deserializeCallback) {
        return this.deserializeCallback(parsed, cell);
      }
      return parsed;
    } catch (e) {
      return { ...cell, value: String(e) };
    }
  }

  public deserializeRaw(value: any, cell?: CellType): CellType {
    if (Time.is(value)) {
      value = Time.ensure(value);
    }
    return { ...cell, value };
  }

  public deserialize(value: string, cell?: CellType): CellPatchType<any> {
    if (value[0] === "'") {
      return { ...cell, value };
    }
    for (let i = 0; i < this.deserializeFunctions.length; i++) {
      const result = this.deserializeFunctions[i](value, cell);
      if (result?.value !== undefined) {
        return { ...cell, ...result };
      }
    }
    if (value === '') {
      return { ...cell, value: undefined };
    }
    return { ...cell, value };
  }

  public deserializeAny(value: string, _cell?: CellType): CellPatchType<string | undefined> {
    if (value == null || value === '') {
      return { value: undefined };
    }
    return { value };
  }

  public deserializeBool(value: string, _cell?: CellType): CellPatchType<boolean | undefined> {
    return { value: BOOLS[value.toLowerCase()] };
  }

  public deserializeNumber(value: string, _cell?: CellType): CellPatchType<number | undefined> {
    const m = value.match(/^-?[\d.]+$/);
    if (m != null && value.match(/\.$/) == null && (value.match(/\./g) || []).length <= 1) {
      return { value: parseFloat(value) };
    }
    return { value: undefined };
  }

  public deserializeTime(value: string, _cell?: CellType): CellPatchType<Time | undefined> {
    if (value.length < 3 || isNaN(value[value.length - 1] as unknown as number)) {
      return { value: undefined };
    }
    return { value: Time.parse(value) };
  }

  public deserializeDate(value: string, _cell?: CellType): CellPatchType<Date | undefined> {
    return { value: parseDate(value) };
  }

  // --- SELECT ---

  public getSelectFallback(_props: SelectFallbackProps): any {
    return { value: null };
  }

  public getSelectOptions(): AutocompleteOption[] {
    return [];
  }

  public select(props: SelectProps): CellType | undefined {
    const { next, sheet, point } = props;
    const options = this.getSelectOptions();
    if (options.length === 0) {
      return next;
    }
    const ok = options.some((o) => o.value === next?.value);
    if (!ok) {
      return { ...next, ...this.getSelectFallback({ sheet, point, value: next?.value }) };
    }
    return next;
  }
}

export type PolicyType = Policy;
export const DEFAULT_POLICY_NAME = 'default';
export const nonePolicy = new Policy({ priority: 0 });
