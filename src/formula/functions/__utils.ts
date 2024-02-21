import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { FormulaError } from '../evaluator';

export const ensureNumber = (value: any, alternative?: number): number => {
  if (typeof value === 'undefined' && typeof alternative !== 'undefined') {
    return alternative;
  }
  if (!value) {
    // falsy is 0
    return 0;
  }
  if (value instanceof Table) {
    const v = stripTable(value, 0, 0);
    return ensureNumber(v, alternative);
  }
  const num = parseFloat(value as string);
  if (isNaN(num)) {
    throw new FormulaError('#VALUE!', `${value} cannot be converted to a number`);
  }
  return num;
};

export const ensureString = (value: any): string => {
  if (!value) {
    return '';
  }
  if (value instanceof Table) {
    const v = stripTable(value, 0, 0);
    return ensureString(v);
  }
  switch (value.constructor.name) {
    case 'Date': {
      const d: Date = value;
      if (d.getHours() + d.getMinutes() + d.getSeconds() === 0) {
        return d.toLocaleDateString();
      }
      return d.toLocaleString();
    }
    default:
      return String(value);
  }
};

export const ensureBoolean = (
  value: any,

  alternative?: boolean,
): boolean => {
  if (typeof value === 'undefined' && typeof alternative !== 'undefined') {
    return alternative;
  }
  if (value === null) {
    return false;
  }
  if (value instanceof Table) {
    const v = stripTable(value, 0, 0);
    return ensureBoolean(v, alternative);
  }
  if (typeof value === 'string' || value instanceof String) {
    const bool = { true: true, false: false }[value.toLowerCase()];
    if (bool == null) {
      throw new FormulaError('#VALUE!', `text '${value as string}' cannot be converted to a boolean`);
    }
    return bool;
  }
  return Boolean(value);
};

export const stripTable = (value: any, y = 0, x = 0) => {
  if (value instanceof Table) {
    return solveTable({ table: value })[y][x];
  }
  return value;
};

const CONDITION_REGEX = /^(?<expr>|<=|>=|<>|>|<|=)?(?<target>.*)$/;

export const check = (value: any, condition: string) => {
  const m = condition.match(CONDITION_REGEX);
  // eslint-disable-next-line no-unsafe-optional-chaining
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const { expr = '', target = '' } = m?.groups || {};

  const comparison = parseFloat(target);
  if (expr === '>' || expr === '<' || expr === '>=' || expr === '<=') {
    if (isNaN(comparison) === (typeof value === 'number')) {
      return false;
    }
    switch (expr) {
      case '>':
        return value > target;
      case '>=':
        return value >= target;
      case '<':
        return value < target;
      case '<=':
        return value <= target;
    }
  }

  const equals = expr === '' || expr === '=';
  if (target === '') {
    return !value === equals;
  }

  if (isNaN(comparison) && (typeof value === 'string' || value instanceof String)) {
    const replaced = target
      .replace(/~\*/g, '(\\*)')
      .replace(/~\?/g, '(\\?)')
      .replace(/\*/g, '(.*)')
      .replace(/\?/g, '(.?)');
    const regex = RegExp(`^${replaced}$`, 'i');
    return regex.test(value as string) === equals;
  }
  return (value == comparison) === equals;
};
