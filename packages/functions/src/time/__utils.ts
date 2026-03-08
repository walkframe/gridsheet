import { FormulaError } from '@gridsheet/react-core';

/**
 * Converts a value to a Date object.
 * Accepts: Date, number (ms since epoch), string (parseable date string).
 */
export function ensureDate(value: any): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  throw new FormulaError('#VALUE!', `${value} cannot be converted to a date`);
}
