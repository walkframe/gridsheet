import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { Sheet, ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns a trimmed sheet based on row and column indices.
If row or column is 0 or omitted, returns all rows or columns.`;

export class IndexFunction extends BaseFunction {
  example = 'INDEX(A1:C10, 2, 3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'range', description: 'A range of cells.', takesMatrix: true, acceptedTypes: ['matrix'] },
    {
      name: 'row_num',
      description: 'The row number in the range (0 or omitted for all rows).',
      optional: true,
      acceptedTypes: ['number'],
    },
    {
      name: 'column_num',
      description: 'The column number in the range (0 or omitted for all columns).',
      optional: true,
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected validate(args: any[]): any[] {
    if (args.length < 1 || args.length > 3) {
      throw new FormulaError('#N/A', 'Number of arguments for INDEX is incorrect.');
    }

    if (!(args[0] instanceof Sheet)) {
      throw new FormulaError('#VALUE!', 'First argument must be a range.');
    }

    if (args.length >= 2) {
      args[1] = ensureNumber(args[1]);
      if (args[1] < 0) {
        throw new FormulaError('#VALUE!', 'Row number must be greater than or equal to 0.');
      }
    }

    if (args.length === 3) {
      args[2] = ensureNumber(args[2]);
      if (args[2] < 0) {
        throw new FormulaError('#VALUE!', 'Column number must be greater than or equal to 0.');
      }
    }
    return args;
  }

  protected main(sheet: Sheet, y?: number, x?: number) {
    const area = sheet.area;
    if (y) {
      if (y < 0 || y > sheet.numRows) {
        throw new FormulaError('#NUM!', `Row number ${y} is out of range.`);
      }
      area.top = area.bottom = area.top + y - 1;
    }
    if (x) {
      if (x < 0 || x > sheet.numCols) {
        throw new FormulaError('#NUM!', `Column number ${x} is out of range.`);
      }
      area.left = area.right = area.left + x - 1;
    }
    return sheet.trim(area);
  }
}
