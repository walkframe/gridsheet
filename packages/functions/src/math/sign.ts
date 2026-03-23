import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns -1 if the value is negative, 1 if positive, and 0 if zero.`;

export class SignFunction extends BaseFunction {
  example = 'SIGN(-3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'The number to check the sign of.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    if (value > 0) {
      return 1;
    }
    if (value < 0) {
      return -1;
    }
    return 0;
  }
}
