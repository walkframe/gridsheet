import type { PolicyMixinType, RenderProps } from './core';

export const CheckboxPolicyMixin: PolicyMixinType = {
  renderBool({ value, sync, sheet, point }: RenderProps<boolean>): any {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          if (sync) {
            sync(sheet.write({ point, value: e.currentTarget.checked.toString() }));
          }
          e.currentTarget.blur();
        }}
      />
    );
  },
};
