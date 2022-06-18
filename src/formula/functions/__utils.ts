import { UserTable } from "../../api/tables";
import { solveMatrix, FormulaError } from "../evaluator";

export const ensureNumber = (
  value: any,
  base: UserTable,
  alternative?: number
): number => {
  if (typeof value === "undefined" && typeof alternative !== "undefined") {
    return alternative;
  }
  if (!value) {
    // falsy is 0
    return 0;
  }
  if (value instanceof UserTable) {
    const v = stripTable(value, base, 0, 0);
    return ensureNumber(v, base, alternative);
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new FormulaError(
      "#VALUE!",
      `${value} cannot be converted to a number`
    );
  }
  return num;
};

export const ensureString = (value: any, base: UserTable): string => {
  if (!value) {
    return "";
  }
  if (value instanceof UserTable) {
    const v = stripTable(value, base, 0, 0);
    return ensureString(v, base);
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

export const ensureBoolean = (
  value: any,
  base: UserTable,
  alternative?: boolean
): boolean => {
  if (typeof value === "undefined" && typeof alternative !== "undefined") {
    return alternative;
  }
  if (value === null) {
    return false;
  }
  if (value instanceof UserTable) {
    const v = stripTable(value, base, 0, 0);
    return ensureBoolean(v, base, alternative);
  }
  if (typeof value === "string" || value instanceof String) {
    // @ts-ignore
    const bool = { true: true, false: false }[value.toLowerCase()];
    if (bool == null) {
      throw new FormulaError(
        "#VALUE!",
        `text '${value}' cannot be converted to a boolean`
      );
    }
    return bool;
  }
  return Boolean(value);
};

export const stripTable = (value: any, base: UserTable, y = 0, x = 0) => {
  if (value instanceof UserTable) {
    return solveMatrix(value, base)[y][x];
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
