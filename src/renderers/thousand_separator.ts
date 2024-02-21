export const ThousandSeparatorRendererMixin = {
  number(value: number): any {
    if (isNaN(value)) {
      return 'NaN';
    }
    const [int, fraction] = String(value).split('.');
    const result = int.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    if (fraction == null) {
      return result;
    }
    return `${result}.${fraction}`;
  },
};
