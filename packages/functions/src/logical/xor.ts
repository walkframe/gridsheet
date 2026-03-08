import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureBoolean } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class XorFunction extends BaseFunction {
  example = 'XOR(A1=1, A2=2)';
  helpText = [
    'Returns TRUE if an odd number of the arguments are logically true.',
    'Returns FALSE if an even number of the arguments are logically true.',
  ];
  helpArgs: HelpArg[] = [
    { name: 'expression1', description: 'First logical expression.', type: ['boolean'] },
    {
      name: 'expression2',
      description: 'Additional logical expressions.',
      type: ['boolean'],
      optional: true,
      iterable: true,
    },
  ];
  category: FunctionCategory = 'logical';

  protected validate() {
    if (this.bareArgs.length === 0) {
      throw new FormulaError('#N/A', 'XOR requires at least one argument.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureBoolean(arg));
  }

  protected main(...values: boolean[]) {
    // XOR is true when an odd number of arguments are true
    return values.reduce((acc, val) => acc !== val, false as boolean);
  }
}
