import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

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
