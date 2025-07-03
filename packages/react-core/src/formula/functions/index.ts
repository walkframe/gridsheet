import { FormulaError } from '../evaluator';
import { Table } from '../../lib/table';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class IndexFunction extends BaseFunction {
  example = 'INDEX(A1:C10, 2, 3)';
  helpText = [
    'Returns a trimmed table based on row and column indices.',
    'If row or column is 0 or omitted, returns all rows or columns.',
  ];
  helpArgs = [
    { name: 'table', description: 'A range of cells.' },
    { name: 'y', description: 'The row number in the table (0 or omitted for all rows).', optional: true },
    { name: 'x', description: 'The column number in the table (0 or omitted for all columns).', optional: true },
  ];

  protected validate() {
    if (this.bareArgs.length < 1 || this.bareArgs.length > 3) {
      throw new FormulaError('#N/A', 'Number of arguments for INDEX is incorrect.');
    }

    if (!(this.bareArgs[0] instanceof Table)) {
      throw new FormulaError('#VALUE!', 'First argument must be a range.');
    }

    if (this.bareArgs.length >= 2) {
      this.bareArgs[1] = ensureNumber(this.bareArgs[1]);
      if (this.bareArgs[1] < 0) {
        throw new FormulaError('#VALUE!', 'Row number must be greater than or equal to 0.');
      }
    }

    if (this.bareArgs.length === 3) {
      this.bareArgs[2] = ensureNumber(this.bareArgs[2]);
      if (this.bareArgs[2] < 0) {
        throw new FormulaError('#VALUE!', 'Column number must be greater than or equal to 0.');
      }
    }
  }

  protected main(table: Table, y?: number, x?: number) {
    const area = table.getArea();
    if (y) {
      if (y < 0 || y > table.getNumRows(1)) {
        throw new FormulaError('#NUM!', `Row number ${y} is out of range.`);
      }
      area.top = area.bottom = area.top + y - 1;
    }
    if (x) {
      if (x < 0 || x > table.getNumCols(1)) {
        throw new FormulaError('#NUM!', `Column number ${x} is out of range.`);
      }
      area.left = area.right = area.left + x - 1;
    }
    return table.trim(area);
  }
}
