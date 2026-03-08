import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Rounds a number down to the nearest integer that is less than or equal to it.`;

export class IntFunction extends BaseFunction {
  example = 'INT(8.9)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'The value to round down to the nearest integer.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    return Math.floor(value);
  }
}
