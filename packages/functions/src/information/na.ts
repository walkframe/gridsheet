import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the error value #N/A, meaning "value not available".`;

export class NaFunction extends BaseFunction {
  example = 'NA()';
  description = description;
  defs: FunctionArgumentDefinition[] = [];
  category: FunctionCategory = 'information';

  protected main() {
    throw new FormulaError('#N/A', 'N/A');
  }
}
