import dayjs from 'dayjs';

import { FormulaError } from '../evaluator';
import { TimeDelta } from '../../lib/time';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';
import { stripTable } from '../../formula/solver';
import { Table } from '../../lib/table';
import { SECONDS_IN_DAY } from '../../constants';

export class MinusFunction extends BaseFunction {
  example = 'MINUS(8, 3)';
  helpText = ['Returns the difference of two numbers.', "This is the same as the '-' operator."];
  helpArgs = [
    { name: 'value1', description: 'A number that will be subtracted.' },
    { name: 'value2', description: 'A number that will subtract from value1.' },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for MINUS is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => {
      if (arg instanceof Table) {
        arg = stripTable({ value: arg });
      }
      return typeof arg === 'object' ? arg : ensureNumber(arg);
    });
  }

  protected main(v1: number | Date | TimeDelta, v2: number | Date | TimeDelta) {
    if (typeof v1 === 'number' && typeof v2 === 'number') {
      return v1 - v2;
    }
    if (v1 instanceof Date && v2 instanceof Date) {
      return new TimeDelta(v1, v2);
    }
    if (v1 instanceof Date && TimeDelta.is(v2)) {
      return TimeDelta.ensure(v2).sub(v1);
    }
    if (TimeDelta.is(v1) && v2 instanceof Date) {
      return TimeDelta.ensure(v1).sub(v2);
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
