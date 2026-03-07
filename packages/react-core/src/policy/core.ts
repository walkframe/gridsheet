import type { FC, ReactNode } from 'react';
import type { UserTable } from '../lib/table';
import type { CellPatchType, CellType, OperationType, PointType } from '../types';

export type AutocompleteOption = {
  value: any;
  label?: any;
  keywords?: string[];
  tooltip?: ReactNode | FC<{ value?: any }>;
};

export type RestrictProps = {
  table: UserTable;
  point: PointType;
  current?: CellType;
  next?: CellType;
  operation: OperationType;
};

export type OnClipProps = {
  table: UserTable;
  point: PointType;
};

export type GetFallbackProps = {
  table: UserTable;
  point: PointType;
  value: any;
};

export type PolicyMixinType = {
  getFallback?: (props: GetFallbackProps) => CellType | undefined;
  select?: (props: RestrictProps) => CellType | undefined;
  validate?: (props: RestrictProps) => CellType | undefined;
  onClip?: (props: OnClipProps) => string;
  getOptions?: () => AutocompleteOption[];
};

type PolicyProps = {
  mixins?: PolicyMixinType[];
  priority?: number;
};

export class Policy implements PolicyMixinType {
  public priority: number = 0;

  constructor(props?: PolicyProps) {
    this.priority = props?.priority ?? 1;
    this.applyMixins(props?.mixins);
  }

  private applyMixins(mixins?: PolicyMixinType[]) {
    if (mixins == null) {
      return;
    }
    for (const mixin of mixins) {
      for (const key in mixin) {
        (this as any)[key] = (mixin as any)[key];
      }
    }
  }

  public getFallback(props: GetFallbackProps): any {
    return { value: null };
  }

  public select(props: RestrictProps) {
    const { next, table, point } = props;
    const options = this.getOptions();
    if (options.length === 0) return next;

    const ok = options.some((o) => o.value === next?.value);
    if (!ok) {
      return { ...next, ...this.getFallback({ table, point, value: next?.value }) };
    }
    return next;
  }

  public validate(props: RestrictProps): CellPatchType | undefined {
    const { next } = props;
    return next;
  }

  public restrict(props: RestrictProps): CellPatchType | undefined {
    const next = this.select(props);
    return this.validate({ ...props, next });
  }

  public onClip(props: OnClipProps): string {
    const { point, table } = props;
    return table.stringify({ point }) ?? '';
  }

  public getOptions(): AutocompleteOption[] {
    return [];
  }
}

export type PolicyType = Policy;
export const DEFAULT_POLICY_NAME = 'default';
export const nonePolicy = new Policy({ priority: 0 });
