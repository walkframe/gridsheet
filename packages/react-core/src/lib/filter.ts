import type { FilterCondition, FilterConditionMethod, FilterConfig } from '../types';
import { parseDate } from './date';
import { TimeDelta } from './time';

type FilterFunction = (condition: FilterCondition, cellValue: any) => boolean;

const _str = (v: any): string => (v == null ? '' : String(v));

type ValueType = 'number' | 'date' | 'timedelta' | 'boolean' | 'string';

function detectType(cellValue: any): ValueType {
  if (typeof cellValue === 'number') {
    return 'number';
  }
  if (cellValue instanceof Date) {
    return 'date';
  }
  if (TimeDelta.is(cellValue)) {
    return 'timedelta';
  }
  if (typeof cellValue === 'boolean') {
    return 'boolean';
  }
  return 'string';
}

function parseAsType(v: string, type: ValueType): { ok: boolean; num: number } {
  switch (type) {
    case 'number': {
      let s = v.replace(/[,_]/g, '');
      let scale = 1;
      if (s.endsWith('%')) {
        s = s.slice(0, -1);
        scale = 0.01;
      }
      const n = Number(s);
      return { ok: !isNaN(n), num: n * scale };
    }
    case 'date': {
      const d = parseDate(v);
      if (!d) {
        return { ok: false, num: NaN };
      }
      return { ok: true, num: d.getTime() };
    }
    case 'timedelta': {
      const td = TimeDelta.parse(v);
      return td ? { ok: true, num: td.toMilliseconds() } : { ok: false, num: NaN };
    }
    case 'boolean': {
      const bv = v.toLowerCase();
      if (bv === 'true') {
        return { ok: true, num: 1 };
      }
      if (bv === 'false') {
        return { ok: true, num: 0 };
      }
      return { ok: false, num: NaN };
    }
    default:
      return { ok: false, num: NaN };
  }
}

function toNumeric(cellValue: any, type: ValueType): number {
  switch (type) {
    case 'number':
      return cellValue as number;
    case 'date':
      return (cellValue as Date).getTime();
    case 'timedelta':
      return TimeDelta.ensure(cellValue).toMilliseconds();
    case 'boolean':
      return cellValue ? 1 : 0;
    default:
      return NaN;
  }
}

const filterEq: FilterFunction = (condition, cellValue) => {
  const vt = detectType(cellValue);
  if (vt === 'string') {
    const s = _str(cellValue);
    return condition.value.some((v) => s === v);
  }
  const cellNum = toNumeric(cellValue, vt);
  return condition.value.some((v) => {
    const parsed = parseAsType(v, vt);
    return parsed.ok && cellNum === parsed.num;
  });
};

const filterNe: FilterFunction = (condition, cellValue) => {
  const vt = detectType(cellValue);
  if (vt === 'string') {
    const s = _str(cellValue);
    return !condition.value.some((v) => s === v);
  }
  const cellNum = toNumeric(cellValue, vt);
  return !condition.value.some((v) => {
    const parsed = parseAsType(v, vt);
    return parsed.ok && cellNum === parsed.num;
  });
};

const filterGt: FilterFunction = (condition, cellValue) => {
  const vt = detectType(cellValue);
  if (vt === 'string') {
    return _str(cellValue) > condition.value[0];
  }
  const cellNum = toNumeric(cellValue, vt);
  const parsed = parseAsType(condition.value[0], vt);
  return parsed.ok && cellNum > parsed.num;
};

const filterGte: FilterFunction = (condition, cellValue) => {
  const vt = detectType(cellValue);
  if (vt === 'string') {
    return _str(cellValue) >= condition.value[0];
  }
  const cellNum = toNumeric(cellValue, vt);
  const parsed = parseAsType(condition.value[0], vt);
  return parsed.ok && cellNum >= parsed.num;
};

const filterLt: FilterFunction = (condition, cellValue) => {
  const vt = detectType(cellValue);
  if (vt === 'string') {
    return _str(cellValue) < condition.value[0];
  }
  const cellNum = toNumeric(cellValue, vt);
  const parsed = parseAsType(condition.value[0], vt);
  return parsed.ok && cellNum < parsed.num;
};

const filterLte: FilterFunction = (condition, cellValue) => {
  const vt = detectType(cellValue);
  if (vt === 'string') {
    return _str(cellValue) <= condition.value[0];
  }
  const cellNum = toNumeric(cellValue, vt);
  const parsed = parseAsType(condition.value[0], vt);
  return parsed.ok && cellNum <= parsed.num;
};

const filterBlank: FilterFunction = (_condition, cellValue) => {
  return cellValue == null || _str(cellValue) === '';
};

const filterNonblank: FilterFunction = (_condition, cellValue) => {
  return cellValue != null && _str(cellValue) !== '';
};

const filterIncludes: FilterFunction = (condition, cellValue) => {
  const s = _str(cellValue).toLowerCase();
  return condition.value.some((v) => s.includes(v.toLowerCase()));
};

const filterExcludes: FilterFunction = (condition, cellValue) => {
  const s = _str(cellValue).toLowerCase();
  return !condition.value.some((v) => s.includes(v.toLowerCase()));
};

export const filterFunctions: Record<FilterConditionMethod, FilterFunction> = {
  eq: filterEq,
  ne: filterNe,
  gt: filterGt,
  gte: filterGte,
  lt: filterLt,
  lte: filterLte,
  blank: filterBlank,
  nonblank: filterNonblank,
  includes: filterIncludes,
  excludes: filterExcludes,
};

export function evaluateFilterCondition(condition: FilterCondition, cellValue: any): boolean {
  const fn = filterFunctions[condition.method];
  return fn ? fn(condition, cellValue) : true;
}

export function evaluateFilterConfig(filter: FilterConfig, cellValue: any): boolean {
  const mode = filter.mode ?? 'or';
  if (filter.conditions.length === 0) {
    return true;
  }
  if (mode === 'and') {
    return filter.conditions.every((c) => evaluateFilterCondition(c, cellValue));
  } else {
    return filter.conditions.some((c) => evaluateFilterCondition(c, cellValue));
  }
}
