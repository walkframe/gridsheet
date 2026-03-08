import { FormulaError } from '@gridsheet/react-core';
import type { FunctionArgumentDefinition } from '@gridsheet/react-core';
import { MatrixFunction } from './__matrix_base';

const description = `Returns the transpose of a matrix.
Rows and columns of the input array are swapped.`;

export class TransposeFunction extends MatrixFunction {
  autoSpilling = true;
  example = 'TRANSPOSE(A1:C3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'matrix', description: 'The matrix to transpose.', takesMatrix: true, acceptedTypes: ['matrix'] },
  ];

  protected validate(args: any[]): any[] {
    if (args.length !== 1) {
      throw new FormulaError('#N/A', 'TRANSPOSE requires exactly 1 argument.');
    }
    const matrix = this.extractNumberMatrix(args[0], 'matrix');
    return [matrix];
  }

  protected main(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = [];
    for (let j = 0; j < cols; j++) {
      result[j] = [];
      for (let i = 0; i < rows; i++) {
        result[j][i] = matrix[i][j];
      }
    }
    return result;
  }
}
