import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the positive square root of a positive number.`;

export class SqrtFunction extends BaseFunction {
  example = 'SQRT(9)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A number for which the positive square root is to be found.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    if (value < 0) {
      throw new FormulaError('NUM!', 'First argument must be positive.');
    }
    return Math.sqrt(value);
  }
}
