import type { UserTable } from '../lib/table';
import type { CellPatchType, CellType, OperationType, PointType } from '../types';

export type PolicyOption = {
  value: any;
  label?: any;
  keyword?: string;
};

export type RestrictProps = {
  table: UserTable;
  point: PointType;
  original?: CellType;
  patch?: CellType;
  operation: OperationType;
};

export type OnClipProps = {
  table: UserTable;
  point: PointType;
};

export type GetDefaultProps = {
  table: UserTable;
  point: PointType;
  value: any;
};

export type PolicyMixinType = {
  getDefault?: (props: GetDefaultProps) => CellType | undefined;
  select?: (props: RestrictProps) => CellType | undefined;
  callback?: (props: RestrictProps) => CellType | undefined;
  onClip?: (props: OnClipProps) => string;
  getOptions?: () => PolicyOption[];
};

type PolicyProps = {
  mixins?: PolicyMixinType[];
};

export class Policy implements PolicyMixinType {
  constructor(props?: PolicyProps) {
    this.applyMixins(props?.mixins);
  }

  private applyMixins(mixins?: PolicyMixinType[]) {
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

  public getDefault(props: GetDefaultProps): any {
    return { value: null };
  }

  public select(props: RestrictProps) {
    const { patch, table, point } = props;
    const options = this.getOptions();
    const index = options.findIndex((option) => option.value === patch?.value);
    if (options.length > 0 && index === -1) {
      return { ...patch, ...this.getDefault({ table, point, value: patch?.value }) };
    }
    return patch;
  }

  public callback(props: RestrictProps): CellPatchType | undefined {
    const { patch } = props;
    return patch;
  }

  public restrict(props: RestrictProps): CellPatchType | undefined {
    const patch = this.select(props);
    return this.callback({ ...props, patch });
  }

  public onClip(props: OnClipProps): string {
    const { point, table } = props;
    return table.stringify({ point }) ?? '';
  }

  public getOptions(): PolicyOption[] {
    return [];
  }
}

export type PolicyType = Policy;
export const defaultPolicy = new Policy();
