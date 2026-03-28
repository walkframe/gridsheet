import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns a Date value representing the specified year, month, and day.`;

export class DateFunction extends BaseFunction {
  example = 'DATE(2024, 3, 15)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'year', description: 'The year component of the date.', acceptedTypes: ['number'] },
    {
      name: 'month',
      description: 'The month component of the date (1=January, 12=December).',
      acceptedTypes: ['number'],
    },
    { name: 'day', description: 'The day component of the date.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'time';

  protected main(year: number, month: number, day: number) {
    // month is 1-based in DATE(), but Date constructor uses 0-based month
    return new Date(year, month - 1, day);
  }
}
