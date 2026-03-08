import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the sin of the angle specified in radians.`;

export class SinFunction extends BaseFunction {
  example = 'SIN(PI()/2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'angle',
      description: 'An angle in radians, at which you want the sin.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(angle: number) {
    return Math.sin(angle);
  }
}
