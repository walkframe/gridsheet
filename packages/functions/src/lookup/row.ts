import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the row number of a specified cell.`;

export class RowFunction extends BaseFunction {
  example = 'ROW(A9)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'cell_reference',
      description: 'The cell whose row number will be returned.',
      acceptedTypes: ['reference'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'lookup';

  protected toMatrix(value: any): any[][] {
    if (value instanceof Table) {
      const area = value.getArea();
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
    if (value instanceof Table) {
      const area = value.getArea();
      return value.trim({ ...area, bottom: area.top });
    }
    return super.toScalar(value);
  }

  protected validate(args: any[]): any[] {
    if (args.length === 0) {
      const point = this.table.getPointById(this.at);
      return [point?.y ?? 1];
    } else if (args.length === 1) {
      const table = args[0] as Table;
      return [table.top];
    } else {
      throw new FormulaError('#N/A', 'Number of arguments for ROW is incorrect.');
    }
  }

  protected main(top: number) {
    return top;
  }
}
