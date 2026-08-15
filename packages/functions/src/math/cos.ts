import { FormulaError } from '@gridsheet/web';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import { ensureNumber } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

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
