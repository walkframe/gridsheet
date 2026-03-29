import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns TRUE if the value is odd.`;

export class IsoddFunction extends BaseFunction {
  example = 'ISODD(3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'The value to check for being odd.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    return Math.floor(Math.abs(value)) % 2 !== 0;
  }
}
