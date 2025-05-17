import { RenderProps } from './core';

export const CheckboxRendererMixin = {
  bool({cell, writer}: RenderProps<boolean>): any {
    return (
      <input
        type="checkbox"
        checked={cell.value}
        onChange={(e) => {
          writer?.(e.currentTarget.checked.toString());
          e.currentTarget.blur();
        }}
      />
    );
  },
};
