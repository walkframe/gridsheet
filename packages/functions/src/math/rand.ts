import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Returns a random number between 0 and 1.`;

export class RandFunction extends BaseFunction {
  example = 'RAND()';
  description = description;
  defs: FunctionArgumentDefinition[] = [];
  category: FunctionCategory = 'math';

  protected main() {
    return Math.random();
  }
}
