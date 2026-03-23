import { Time } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns a Date value representing the specified hour, minute, and second (on the base date 1899-12-30).`;

export class TimeFunction extends BaseFunction {
  example = 'TIME(13, 30, 0)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'hour', description: 'The hour component (0–23).', acceptedTypes: ['number'] },
    { name: 'minute', description: 'The minute component (0–59).', acceptedTypes: ['number'] },
    { name: 'second', description: 'The second component (0–59).', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'time';

  protected main(hour: number, minute: number, second: number) {
    return Time.create(hour, minute, second);
  }
}
