import dayjs from 'dayjs';

import { FormulaError } from '../formula-error';
import { BaseFunction, type FunctionCategory, type FunctionArgumentDefinition } from './__base';
import { ensureNumber } from './__utils';
import { Time } from '../../lib/time';
import { SECONDS_IN_DAY } from '../../constants';

const description = `Returns the sum of two numbers.
This is the same as the '+' operator.`;

export class AddFunction extends BaseFunction {
  example = 'ADD(2, 3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'First additive.', acceptedTypes: ['number', 'date', 'time'] },
    { name: 'value2', description: 'Second additive.', acceptedTypes: ['number', 'date', 'time'] },
  ];
  category: FunctionCategory = 'math';

  protected main(v1: number | Date | Time, v2: number | Date | Time) {
    if (typeof v1 === 'number' && typeof v2 === 'number') {
      return v1 + v2;
    }
    if (v1 instanceof Date && Time.is(v2)) {
      return Time.ensure(v2).add(v1);
    }
    if (Time.is(v1) && v2 instanceof Date) {
      return Time.ensure(v1).add(v2);
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
