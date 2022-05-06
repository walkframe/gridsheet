import { UserTable } from "../../api/tables";
import { evaluateTable, FormulaError } from "../evaluator";

export const forceNumber = (
  value: any,
  base: UserTable,
  raise = true
): number => {
  if (!value) {
    // falsy is 0
    return 0;
  }
  if (value instanceof UserTable) {
    const v = evaluateTable(value, base)[0][0];
    return forceNumber(v, base);
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    if (raise) {
      throw new FormulaError(
        "VALUE!",
        `${value} cannot be converted to a number`
      );
    }
    return 0;
  }
  return num;
};

export const forceString = (value: any, base: UserTable): string => {
  if (!value) {
    return "";
  }
  if (value instanceof UserTable) {
    const v = evaluateTable(value, base)[0][0];
    return forceString(v, base);
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

export const forceBoolean = (
  value: any,
  base: UserTable,
  raise = true
): boolean => {
  if (value == null) {
    return false;
  }
  if (value instanceof UserTable) {
    const v = evaluateTable(value, base)[0][0];
    return forceBoolean(v, base);
  }
  if (typeof value === "string" || value instanceof String) {
    const bool = { true: true, false: false }[value.toLowerCase()];
    if (bool == null) {
      if (raise) {
        throw new FormulaError(
          "VALUE!",
          `text '${value}' cannot be converted to a boolean`
        );
      }
      return false;
    }
    return bool;
  }
  return Boolean(value);
};

export const forceScalar = (value: any, base: UserTable) => {
  if (value instanceof UserTable) {
    return evaluateTable(value, base)[0][0];
  }
  return value;
};

const CONDITION_REGEX = /^(?<expr>|<=|>=|<>|>|<|=)?(?<target>.*)$/;

export const check = (value: any, condition: string) => {
  const m = condition.match(CONDITION_REGEX);
  const { expr = "", target = "" } = m?.groups!;

  const comparison = parseFloat(target);
  if (expr === ">" || expr === "<" || expr === ">=" || expr === "<=") {
    if (isNaN(comparison) === (typeof value === "number")) {
      return false;
    }
    switch (expr) {
      case ">":
        return value > target;
      case ">=":
        return value >= target;
      case "<":
        return value < target;
      case "<=":
        return value <= target;
    }
  }

  const equals = expr === "" || expr === "=";
  if (target === "") {
    return !value === equals;
  }

  if (
    isNaN(comparison) &&
    (typeof value === "string" || value instanceof String)
  ) {
    const replaced = target
      .replace(/~\*/g, "(\\*)")
      .replace(/~\?/g, "(\\?)")
      .replace(/\*/g, "(.*)")
      .replace(/\?/g, "(.?)");
    const regex = RegExp(`^${replaced}$`, "i");
    return regex.test(value as string) === equals;
  }
  return (value == comparison) === equals;
};
