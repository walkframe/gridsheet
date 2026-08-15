import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Returns the tan of the angle specified in radians.`;

export class TanFunction extends BaseFunction {
  example = 'TAN(PI()/4)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'angle',
      description: 'An angle in radians, at which you want the tan.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(angle: number) {
    return Math.tan(angle);
  }
}
