import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the value of Pi.`;

export class PiFunction extends BaseFunction {
  example = 'PI()';
  description = description;
  defs: FunctionArgumentDefinition[] = [];
  category: FunctionCategory = 'math';

  protected main() {
    return Math.PI;
  }
}
