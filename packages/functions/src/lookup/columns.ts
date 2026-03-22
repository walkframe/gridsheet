import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Sheet } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the number of columns in a specified array or range.`;

export class ColumnsFunction extends BaseFunction {
  example = 'COLUMNS(A1:D5)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'range',
      description: 'The array or range whose number of columns will be returned.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected main(value: any) {
    const matrix = this.toMatrix(value);
    return matrix[0]?.length || 0;
  }
}
