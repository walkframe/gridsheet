import { FormulaError } from '@gridsheet/engine';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { ensureNumber } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

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
