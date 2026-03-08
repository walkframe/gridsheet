import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class ColumnsFunction extends BaseFunction {
  example = 'COLUMNS(A1:D5)';
  helpText = ['Returns the number of columns in a specified array or range.'];
  helpArgs: HelpArg[] = [
    {
      name: 'range',
      description: 'The array or range whose number of columns will be returned.',
      type: ['range', 'reference'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for COLUMNS is incorrect.');
    }
    if (!(this.bareArgs[0] instanceof Table)) {
      throw new FormulaError('#VALUE!', 'Argument must be a range.');
    }
  }

  protected main(range: Table) {
    const area = range.getArea();
    return area.right - area.left + 1;
  }
}
