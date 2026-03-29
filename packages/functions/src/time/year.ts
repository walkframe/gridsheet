import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';
import { ensureDate } from '@gridsheet/core';

const description = `Returns the year of a given date.`;

export class YearFunction extends BaseFunction {
  example = 'YEAR(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'date', description: 'The date from which to extract the year.', acceptedTypes: ['date', 'string'] },
  ];
  category: FunctionCategory = 'time';

  protected main(date: any) {
    return ensureDate(date).getFullYear();
  }
}
