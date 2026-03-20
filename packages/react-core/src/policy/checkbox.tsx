import type { PolicyMixinType, RenderProps } from './core';

export const CheckboxPolicyMixin: PolicyMixinType = {
  renderBool({ value, sync, table, point }: RenderProps<boolean>): any {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          if (sync) {
            sync(table.write({ point, value: e.currentTarget.checked.toString() }));
          }
          e.currentTarget.blur();
        }}
      />
    );
  },
};
