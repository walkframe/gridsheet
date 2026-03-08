import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

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
