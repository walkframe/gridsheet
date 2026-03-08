import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ColFunction extends BaseFunction {
  example = 'COL(A9)';
  helpText = ['Returns the col number of a specified cell.'];
  helpArgs: HelpArg[] = [
    {
      name: 'cell_reference',
      description: 'The cell whose col number will be returned.',
      optional: true,
      type: ['reference'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected validate() {
    if (this.bareArgs.length === 0) {
      this.bareArgs = [this.origin?.x ?? 1];
    } else if (this.bareArgs.length === 1) {
      const table = this.bareArgs[0] as Table;
      this.bareArgs = [table.left];
    } else {
      throw new FormulaError('#N/A', 'Number of arguments for COL is incorrect.');
    }
  }

  protected main(left: number) {
    return left;
  }
}
