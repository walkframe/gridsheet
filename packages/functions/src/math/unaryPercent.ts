import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns a value interpreted as a percentage, i.e. divides the number by 100.`;

export class UnaryPercentFunction extends BaseFunction {
  example = 'UNARY_PERCENT(50)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A number to be divided by 100.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    return value / 100;
  }
}
