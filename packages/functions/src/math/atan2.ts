import { FormulaError } from '@gridsheet/web';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import { ensureNumber } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

const description = `Returns the angle in radians between the x-axis and a line passing from the origin through a given coordinate point (x, y).`;

export class Atan2Function extends BaseFunction {
  example = 'ATAN2(4,3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'x',
      description: 'x of the point.',
      acceptedTypes: ['number'],
    },
    {
      name: 'y',
      description: 'y of the point.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(x: number, y: number) {
    return Math.atan2(x, y);
  }
}
