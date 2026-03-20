import { FormulaError } from '@gridsheet/react-core';
import type { FunctionArgumentDefinition } from '@gridsheet/react-core';
import { MatrixFunction } from './__matrix_base';

const description = `Returns the determinant of a square matrix.`;

export class MdetermFunction extends MatrixFunction {
  example = 'MDETERM(A1:C3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'matrix', description: 'A square numeric matrix.', takesMatrix: true, acceptedTypes: ['matrix'] },
  ];

  protected validate(args: any[]): any[] {
    if (args.length !== 1) {
      throw new FormulaError('#N/A', 'MDETERM requires exactly 1 argument.');
    }
    const matrix = this.extractNumberMatrix(args[0], 'matrix');
    this.requireSquare(matrix, 'MDETERM');
    return [matrix];
  }

  protected main(matrix: number[][]): number {
    return this.determinant(matrix);
  }

  private determinant(mat: number[][]): number {
    const n = mat.length;
    const a: number[][] = mat.map((row) => [...row]);
    let det = 1;

    for (let col = 0; col < n; col++) {
      let pivotRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(a[row][col]) > Math.abs(a[pivotRow][col])) {
          pivotRow = row;
        }
      }
      if (pivotRow !== col) {
        [a[col], a[pivotRow]] = [a[pivotRow], a[col]];
        det *= -1;
      }
      if (Math.abs(a[col][col]) < 1e-10) {
        return 0;
      }
      det *= a[col][col];
      for (let row = col + 1; row < n; row++) {
        const factor = a[row][col] / a[col][col];
        for (let j = col; j < n; j++) {
          a[row][j] -= factor * a[col][j];
        }
      }
    }
    return det;
  }
}
