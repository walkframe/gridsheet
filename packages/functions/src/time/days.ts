import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const description = `Returns the number of days between two dates.`;

export class DaysFunction extends BaseFunction {
  example = 'DAYS(A2, A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'end_date', description: 'The end date.', acceptedTypes: ['date', 'string'] },
    { name: 'start_date', description: 'The start date.', acceptedTypes: ['date', 'string'] },
  ];
  category: FunctionCategory = 'time';

  protected main(endDate: any, startDate: any) {
    const end = ensureDate(endDate);
    const start = ensureDate(startDate);
    return Math.trunc((end.getTime() - start.getTime()) / MS_PER_DAY);
  }
}
