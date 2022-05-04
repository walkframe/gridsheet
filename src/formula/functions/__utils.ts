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

export const forceString = (value: any): string => {
  if (!value) {
    return "";
  }
  switch (value.constructor.name) {
    case "Date":
      if (value.getHours() + value.getMinutes() + value.getSeconds() === 0) {
        return value.toLocaleDateString();
      }
      return value.toLocaleString();
    default:
      return String(value);
  }
};
