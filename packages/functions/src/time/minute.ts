import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';
import { ensureDate } from '@gridsheet/engine';

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
