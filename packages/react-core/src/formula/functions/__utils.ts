import { stripTable, solveTable } from '../solver';
import { Table } from '../../lib/table';
import { FormulaError } from '../formula-error';
import dayjs from 'dayjs';
import { FULLDATE_FORMAT_UTC } from '../../constants';
import { Pending, Spilling } from '../../sentinels';
import type { Id, PointType } from '../../types';

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
  return ensureString(left).toLowerCase() === ensureString(right).toLowerCase();
};

export const ne = (left: any, right: any): boolean => {
  return !eq(left, right);
};

export type EnsureNumberOptions = {
  alternative?: number;
  ignore?: boolean;
};

export type EnsureBooleanOptions = {
  alternative?: boolean;
  ignore?: boolean;
};

export const ensureNumber = (value: any, options?: EnsureNumberOptions): number => {
  const { alternative, ignore } = options || {};
  if (Pending.is(value)) {
    return value as any;
  }
  if (typeof value === 'undefined' && typeof alternative !== 'undefined') {
    return alternative;
  }
  if (!value) {
    // falsy is 0
    return 0;
  }
  if (value instanceof Table) {
    const v = stripTable({ value });
    return ensureNumber(v, { alternative });
  }
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string' && value.endsWith('%')) {
    const num = parseFloat(value.slice(0, -1));
    if (!isNaN(num)) {
      return num / 100;
    }
  }

  const num = parseFloat(value as string);
  if (isNaN(num)) {
    if (ignore) {
      return 0;
    }
    throw new FormulaError('#VALUE!', `${value} cannot be converted to a number`);
  }
  return num;
};

export const ensureString = (value: any): string => {
  if (Pending.is(value)) {
    return value as any;
  }
  if (value === 0) {
    return '0';
  }
  if (!value) {
    return '';
  }
  if (value instanceof Table) {
    const v = stripTable({ value });
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

export const ensureBoolean = (value: any, options?: EnsureBooleanOptions): boolean => {
  const { alternative, ignore } = options ?? {};
  if (Pending.is(value)) {
    return value as any;
  }
  if (typeof value === 'undefined' && typeof alternative !== 'undefined') {
    return alternative;
  }
  if (value === null) {
    return false;
  }
  if (value instanceof Table) {
    const v = stripTable({ value });
    return ensureBoolean(v, options);
  }
  if (typeof value === 'string' || value instanceof String) {
    const bool = { true: true, false: false }[value.toLowerCase()];
    if (bool == null) {
      if (ignore) {
        return false;
      }
      throw new FormulaError('#VALUE!', `text '${value as string}' cannot be converted to a boolean`);
    }
    return bool;
  }
  return Boolean(value);
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

export const eachMatrix = (value: any, callback: (v: any, relativePoint: PointType) => void, at: Id) => {
  if (value instanceof Table) {
    const matrix = solveTable({ table: value, at });
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        callback(matrix[y][x], { y, x });
      }
    }
  } else if (Spilling.is(value)) {
    const matrix = value.matrix;
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        callback(matrix[y][x], { y, x });
      }
    }
  } else if (Array.isArray(value) && Array.isArray(value[0])) {
    for (let y = 0; y < value.length; y++) {
      for (let x = 0; x < value[y].length; x++) {
        callback(value[y][x], { y, x });
      }
    }
  } else {
    callback(value, { y: 0, x: 0 });
  }
};

export const createBooleanMask = (tables: Table[], conditions: string[], at: Id): boolean[][] => {
  if (tables.length === 0) {
    return [];
  }
  const refRange = tables[0];
  const numRows = refRange.getNumRows();
  const numCols = refRange.getNumCols();

  const mask: boolean[][] = Array.from({ length: numRows }, () => Array(numCols).fill(true));

  for (let p = 0; p < tables.length; p++) {
    const condRange = tables[p];
    const condition = conditions[p];
    eachMatrix(
      condRange,
      (v: any, pt: PointType) => {
        mask[pt.y][pt.x] &&= check(v, condition);
      },
      at,
    );
  }
  return mask;
};
