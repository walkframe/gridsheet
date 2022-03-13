
export const sum = (...vs: number[]) => {
  return vs.map((v) => v || 0).reduce((a, b) => a + b);
};
