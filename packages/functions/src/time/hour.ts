import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';
import { ensureDate } from '@gridsheet/web';

const description = `Returns the hour component of a given time/date value (0–23).`;

export class HourFunction extends BaseFunction {
  example = 'HOUR(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'time',
      description: 'The time or date-time value from which to extract the hour.',
      acceptedTypes: ['date', 'string'],
    },
  ];
  category: FunctionCategory = 'time';

  protected main(time: any) {
    return ensureDate(time).getHours();
  }
}
