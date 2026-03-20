import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

const description = `Returns the day of the month for a given date (1–31).`;

export class DayFunction extends BaseFunction {
  example = 'DAY(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'date', description: 'The date from which to extract the day.', acceptedTypes: ['date', 'string'] },
  ];
  category: FunctionCategory = 'time';

  protected main(date: any) {
    return ensureDate(date).getDate();
  }
}
