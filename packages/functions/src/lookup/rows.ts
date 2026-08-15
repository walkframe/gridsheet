import { FormulaError } from '@gridsheet/engine';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { Sheet } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

const description = `Returns the number of rows in a specified array or range.`;

export class RowsFunction extends BaseFunction {
  example = 'ROWS(A1:D5)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'range',
      description: 'The array or range whose number of rows will be returned.',
      takesMatrix: true,
      acceptedTypes: ['matrix', 'reference'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected main(value: any) {
    const matrix = this.toMatrix(value);
    return matrix.length;
  }
}
