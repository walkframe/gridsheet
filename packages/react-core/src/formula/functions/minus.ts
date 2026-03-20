import dayjs from 'dayjs';

import { FormulaError } from '../formula-error';
import { Time } from '../../lib/time';
import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureNumber } from './__utils';
import { stripSheet } from '../../formula/solver';
import { Sheet } from '../../lib/sheet';
import { SECONDS_IN_DAY } from '../../constants';

const description = `Returns the difference of two numbers.
This is the same as the '-' operator.`;

export class MinusFunction extends BaseFunction {
  example = 'MINUS(8, 3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'A number that will be subtracted.', acceptedTypes: ['number', 'date', 'time'] },
    {
      name: 'value2',
      description: 'A number that will subtract from value1.',
      acceptedTypes: ['number', 'date', 'time'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    return super.validate(args).map((arg) => {
      if (arg instanceof Sheet) {
        arg = stripSheet({ value: arg });
      }
      return typeof arg === 'object' ? arg : ensureNumber(arg);
    });
  }

  protected main(v1: number | Date | Time, v2: number | Date | Time) {
    if (typeof v1 === 'number' && typeof v2 === 'number') {
      return v1 - v2;
    }
    if (v1 instanceof Date && v2 instanceof Date) {
      return Time.fromDates(v1, v2);
    }
    if (v1 instanceof Date && Time.is(v2)) {
      return Time.ensure(v2).sub(v1);
    }
    if (Time.is(v1) && v2 instanceof Date) {
      return Time.ensure(v1).sub(v2);
    }
    if (v1 instanceof Date && typeof v2 === 'number') {
      return dayjs(v1)
        .subtract(v2 * SECONDS_IN_DAY, 'second')
        .toDate();
    }
    try {
      return ensureNumber(v1, { alternative: 0 }) - ensureNumber(v2, { alternative: 0 });
    } catch (e) {
      throw new FormulaError('#VALUE!', 'Mismatched types for minuend or subtrahend.');
    }
  }
}
