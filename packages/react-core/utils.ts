export const setDefault = <K = PropertyKey, D = any>(target: any, key: K, defaultValue: D): D => {
  if (target[key] == null) {
    target[key] = defaultValue;
  }
  return target[key];
};
