/**
 * Multiplies `value` by 10^`digit` exactly by shifting the decimal exponent in its string form.
 * `value * Math.pow(10, digit)` is lossy (`1.005 * 100 === 100.49999999999999`), which broke rounding.
 */
const shift = (value: number, digit: number): number => {
  const [mantissa, exponent = '0'] = String(value).split('e');
  return Number(`${mantissa}e${Number(exponent) + digit}`);
};

/**
 * Rounds `value` to `digit` decimal places with `rounder` (e.g. Math.round / Math.ceil / Math.floor)
 * without floating-point scaling errors. A negative `digit` rounds to the left of the decimal point.
 */
export const roundDecimal = (value: number, digit: number, rounder: (n: number) => number): number => {
  if (!Number.isFinite(value)) {
    return value;
  }
  const d = Math.trunc(digit);
  const rounded = shift(rounder(shift(value, d)), -d);
  return rounded === 0 ? 0 : rounded; // normalize -0
};
