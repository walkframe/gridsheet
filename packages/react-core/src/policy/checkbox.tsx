import type { PolicyMixinType, RenderProps } from '@gridsheet/core/policy/core';

export const CheckboxPolicyMixin: PolicyMixinType = {
  renderBool({ value, apply, sheet, point }: RenderProps<boolean>): any {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          if (apply) {
            apply(sheet.write({ point, value: e.currentTarget.checked.toString() }));
          }
          e.currentTarget.blur();
        }}
      />
    );
  },
};
