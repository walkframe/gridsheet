import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { Sheet } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the column number of a specified cell.`;

export class ColumnFunction extends BaseFunction {
  example = 'COLUMN(A9)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'cell_reference',
      description: 'The cell whose column number will be returned.',
      optional: true,
      acceptedTypes: ['reference'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected toMatrix(value: any): any[][] {
    if (value instanceof Sheet) {
      const area = value.area;
      const result: any[][] = [];
      for (let r = area.top; r <= area.bottom; r++) {
        const row: any[] = [];
        for (let c = area.left; c <= area.right; c++) {
          row.push(value.trim({ top: r, left: c, bottom: r, right: c }));
        }
        result.push(row);
      }
      return result;
    }
    return super.toMatrix(value);
  }

  protected toScalar(value: any): any {
    if (value instanceof Sheet) {
      const area = value.area;
      return value.trim({ ...area, right: area.left });
    }
    return super.toScalar(value);
  }

  protected validate(args: any[]): any[] {
    if (args.length === 0) {
      const point = this.sheet.getPointById(this.at);
      return [point?.x ?? 1];
    } else if (args.length === 1) {
      const sheet = args[0] as Sheet;
      return [sheet.left];
    } else {
      throw new FormulaError('#N/A', 'Number of arguments for COLUMN is incorrect.');
    }
  }

  protected main(left: number) {
    return left;
  }
}
