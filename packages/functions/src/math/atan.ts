import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the inverse tan of the value in radians.`;

export class AtanFunction extends BaseFunction {
  example = 'ATAN(1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A value for the inverse tan.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    return Math.atan(value);
  }
}
