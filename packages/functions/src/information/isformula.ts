import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class IsformulaFunction extends BaseFunction {
  example = 'ISFORMULA(A1)';
  helpText = ['Returns TRUE if the referenced cell contains a formula.'];
  helpArgs: HelpArg[] = [
    {
      name: 'reference',
      description: 'The cell reference to check for a formula.',
      type: ['reference'],
    },
  ];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISFORMULA is incorrect.');
    }
    if (!(this.bareArgs[0] instanceof Table)) {
      throw new FormulaError('#VALUE!', 'Argument must be a cell reference.');
    }
  }

  protected main(ref: Table) {
    const cell = ref.getCellByPoint({ y: ref.top, x: ref.left }, 'SYSTEM');
    const raw = cell?.value;
    return typeof raw === 'string' && raw.startsWith('=');
  }
}
