import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Converts an angle value in degrees to radians.`;

export class RadiansFunction extends BaseFunction {
  example = 'RADIANS(180)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'angle',
      description: 'An angle in degrees that you want to convert to radians.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(angle: number) {
    return (angle / 180) * Math.PI;
  }
}
