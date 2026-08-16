import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';
import { ensureDate } from '@gridsheet/engine';

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
