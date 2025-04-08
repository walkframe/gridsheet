import { WriterType } from '../types';

export const CheckboxRendererMixin = {
  bool(value: boolean, writer?: WriterType): any {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          writer && writer(e.currentTarget.checked.toString());
          e.currentTarget.blur();
        }}
      />
    );
  },
};
