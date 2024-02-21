// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setDefault = <K = PropertyKey, D = any>(target: any, key: K, defaultValue: D): D => {
  if (target[key] == null) {
    target[key] = defaultValue;
  }
  return target[key];
};
