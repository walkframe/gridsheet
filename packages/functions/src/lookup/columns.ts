import { FormulaError } from '@gridsheet/engine';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import { Sheet } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

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
