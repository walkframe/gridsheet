import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { Sheet } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

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
