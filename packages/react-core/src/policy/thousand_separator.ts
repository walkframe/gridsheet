import type { PolicyMixinType, RenderProps } from './core';

const makeThousandSeparatorMixin = (sep: string): PolicyMixinType => ({
  renderNumber({ value }: RenderProps<number>): any {
    if (value == null || isNaN(value)) {
      return 'NaN';
    }
    const [int, fraction] = String(value.toPrecision(this.decimalPrecision)).split('.');
    const result = int.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${sep}`);
    if (fraction == null) {
      return result;
    }
    return `${result}.${fraction}`;
  },
});

export const ThousandSeparatorPolicyMixin: PolicyMixinType = makeThousandSeparatorMixin(',');
export const ThousandSpaceSeparatorPolicyMixin: PolicyMixinType = makeThousandSeparatorMixin(' ');
