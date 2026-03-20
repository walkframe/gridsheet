import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureBoolean } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns TRUE if an odd number of the arguments are logically true.
Returns FALSE if an even number of the arguments are logically true.`;

export class XorFunction extends BaseFunction {
  example = 'XOR(A1=1, A2=2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'expression', description: 'Logical expressions to evaluate.', acceptedTypes: ['boolean'], variadic: true },
  ];
  category: FunctionCategory = 'logical';

  protected main(...values: boolean[]) {
    // XOR is true when an odd number of arguments are true
    return values.reduce((acc, val) => acc !== val, false as boolean);
  }
}
