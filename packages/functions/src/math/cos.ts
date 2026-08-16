import { FormulaError } from '@gridsheet/engine';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { ensureNumber } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Returns the cos of the angle specified in radians.`;

export class CosFunction extends BaseFunction {
  example = 'COS(PI())';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'angle',
      description: 'An angle in radians, at which you want the cos.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(angle: number) {
    return Math.cos(angle);
  }
}
