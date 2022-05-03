import { FormulaError } from "../evaluator";

export const forceNumber = (value: any) => {
  if (!value) {
    // falsy is 0
    return 0;
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new FormulaError(
      "VALUE!",
      `${value} cannot be converted to a number`
    );
  }
  return num;
};
