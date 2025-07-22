import dayjs from 'dayjs';

import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';
import { stripTable } from '../../formula/solver';
import { Table } from '../../lib/table';
import { TimeDelta } from '../../lib/time';
import { SECONDS_IN_DAY } from '../../constants';

export class AddFunction extends BaseFunction {
  example = 'ADD(2, 3)';
  helpText = ['Returns the sum of two numbers.', "This is the same as the '+' operator."];
  helpArgs = [
    { name: 'value1', description: 'First additive.' },
    { name: 'value2', description: 'Second additive.' },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for ADD is incorrect.');
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
      return v1 + v2;
    }
    if (v1 instanceof Date && TimeDelta.is(v2)) {
      return TimeDelta.ensure(v2).add(v1);
    }
    if (TimeDelta.is(v1) && v2 instanceof Date) {
      return TimeDelta.ensure(v1).add(v2);
    }
    if (v1 instanceof Date && typeof v2 === 'number') {
      return dayjs(v1)
        .add(v2 * SECONDS_IN_DAY, 'second')
        .toDate();
    }
    if (typeof v1 === 'number' && v2 instanceof Date) {
      return dayjs(v2)
        .add(v1 * SECONDS_IN_DAY, 'second')
        .toDate();
    }
    try {
      return ensureNumber(v1, { alternative: 0 }) + ensureNumber(v2, { alternative: 0 });
    } catch (e) {
      throw new FormulaError('#VALUE!', 'Mismatched types for augend or addend.');
    }
  }
}
