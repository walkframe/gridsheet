import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

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
