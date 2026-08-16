import { FormulaError } from '@gridsheet/engine';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { ensureNumber } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Returns the inverse cos of the value in radians.`;

export class AcosFunction extends BaseFunction {
  example = 'ACOS(0)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A value for the inverse cos between -1 and 1.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    if (-1 > value || value > 1) {
      throw new FormulaError('#NUM!', 'value must be between -1 and 1');
    }
    return Math.acos(value);
  }
}
