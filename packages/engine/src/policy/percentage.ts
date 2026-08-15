import type { PolicyMixinType, RenderProps } from './core';

export const PercentagePolicyMixin: PolicyMixinType = {
  renderNumber({ value }: RenderProps<number>): any {
    if (value == null || isNaN(value)) {
      return '0%';
    }
    return `${parseFloat((value * 100).toPrecision(this.decimalPrecision))}%`;
  },
};
