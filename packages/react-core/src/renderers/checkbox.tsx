import { RenderProps } from './core';

export const CheckboxRendererMixin = {
  bool({ value, writer }: RenderProps<boolean>): any {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          writer?.(e.currentTarget.checked.toString());
          e.currentTarget.blur();
        }}
      />
    );
  },
};
