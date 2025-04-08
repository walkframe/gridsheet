import { Table } from '../../lib/table';
import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';

export class ColFunction extends BaseFunction {
  example = 'COL(A9)';
  helpText = ['Returns the col number of a specified cell.'];
  helpArgs = [
    {
      name: 'cell_reference',
      description: 'The cell whose col number will be returned.',
      option: true,
    },
  ];

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
