import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { FormulaError } from '../evaluator';
import dayjs from 'dayjs';
import { FULLDATE_FORMAT_UTC } from '../../constants';

export const gt = (left: any, right: any): boolean => {
  if (typeof left === 'string' || typeof right === 'string') {
    return ensureString(left) > ensureString(right);
  }
  try {
    return ensureNumber(left) > ensureNumber(right);
  } catch {
    return false;
  }
};

export const gte = (left: any, right: any): boolean => {
  if (typeof left === 'string' || typeof right === 'string') {
    return ensureString(left) >= ensureString(right);
  }
  try {
    return ensureNumber(left) >= ensureNumber(right);
  } catch {
    return false;
  }
};

export const lt = (left: any, right: any): boolean => {
  return !gte(left, right);
};

export const lte = (left: any, right: any): boolean => {
  return !gt(left, right);
};

export const eq = (left: any, right: any): boolean => {
  return ensureString(left) === ensureString(right);
};

export const ne = (left: any, right: any): boolean => {
  return !eq(left, right);
};

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
  if (value instanceof Date) {
    return value.getTime();
  }
  const num = parseFloat(value as string);
  if (isNaN(num)) {
    throw new FormulaError('#VALUE!', `${value} cannot be converted to a number`);
  }
  return num;
};

export const ensureString = (value: any): string => {
  if (value === 0) {
    return '0';
  }
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
      return dayjs(d).format(FULLDATE_FORMAT_UTC);
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

const CONDITION_REGEX = /^(<=|>=|<>|>|<|=)?(.*)$/;

export const check = (value: any, condition: string): boolean => {
  const m = condition.match(CONDITION_REGEX);

  const [, expr = '', target = ''] = m || [];
  let comparison: any = target;
  if (expr === '>' || expr === '<' || expr === '>=' || expr === '<=') {
    if (typeof value === 'number') {
      comparison = parseFloat(target);
    }
    switch (expr) {
      case '>':
        return gt(value, comparison);
      case '>=':
        return gte(value, comparison);
      case '<':
        return lt(value, comparison);
      case '<=':
        return lte(value, comparison);
    }
  }

  const equals = expr === '' || expr === '=';
  if (target === '') {
    // empty target means "" or "<>"
    return (value == null || value === '') === equals;
  }

  if (typeof value === 'string' || value instanceof String) {
    const replaced = target
      .replace(/~\*/g, '(\\*)')
      .replace(/~\?/g, '(\\?)')
      .replace(/\*/g, '(.*)')
      .replace(/\?/g, '(.)');
    const regex = RegExp(`^${replaced}$`, 'i');
    return regex.test(value as string) === equals;
  }
  return eq(value, comparison) === equals;
};
