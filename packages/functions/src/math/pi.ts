import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

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
