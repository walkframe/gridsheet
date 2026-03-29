import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Truncates a number to a certain number of significant digits by omitting less significant digits.`;

export class TruncFunction extends BaseFunction {
  example = 'TRUNC(3.14159, 2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'The number to truncate.', acceptedTypes: ['number'] },
    {
      name: 'places',
      description: 'The number of significant digits to keep. Defaults to 0.',
      acceptedTypes: ['number'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number, places = 0) {
    const p = Math.floor(places);
    const factor = Math.pow(10, p);
    return (value >= 0 ? Math.floor : Math.ceil)(value * factor) / factor;
  }
}
