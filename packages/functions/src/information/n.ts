import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { ensureNumber } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Returns the argument provided as a number.`;

export class NFunction extends BaseFunction {
  example = 'N(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to convert to a number.',
      acceptedTypes: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    try {
      return ensureNumber(value);
    } catch {
      return 0;
    }
  }
}
