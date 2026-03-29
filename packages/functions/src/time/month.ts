import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';
import { ensureDate } from '@gridsheet/core';

const description = `Returns the month of a given date as a number (1=January, 12=December).`;

export class MonthFunction extends BaseFunction {
  example = 'MONTH(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'date', description: 'The date from which to extract the month.', acceptedTypes: ['date', 'string'] },
  ];
  category: FunctionCategory = 'time';

  protected main(date: any) {
    return ensureDate(date).getMonth() + 1;
  }
}
