import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';
import { ensureDate } from '@gridsheet/web';

const description = `Returns the minute component of a given time/date value (0–59).`;

export class MinuteFunction extends BaseFunction {
  example = 'MINUTE(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'time',
      description: 'The time or date-time value from which to extract the minute.',
      acceptedTypes: ['date', 'string'],
    },
  ];
  category: FunctionCategory = 'time';

  protected main(time: any) {
    return ensureDate(time).getMinutes();
  }
}
