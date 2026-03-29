import { FormulaError } from '@gridsheet/core';
import type { FunctionArgumentDefinition } from '@gridsheet/core';
import { MatrixFunction } from './__matrix_base';

const description = `Returns the inverse of a square matrix.
The matrix must be square and non-singular (determinant ≠ 0).`;

export class MinverseFunction extends MatrixFunction {
  autoSpilling = true;
  example = 'MINVERSE(A1:C3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'matrix', description: 'A square numeric matrix.', takesMatrix: true, acceptedTypes: ['matrix'] },
  ];

  protected validate(args: any[]): any[] {
    if (args.length !== 1) {
      throw new FormulaError('#N/A', 'MINVERSE requires exactly 1 argument.');
    }
    const matrix = this.extractNumberMatrix(args[0], 'matrix');
    this.requireSquare(matrix, 'MINVERSE');
    const inv = this.invertMatrix(matrix);
    if (inv === null) {
      throw new FormulaError('#NUM!', 'MINVERSE: matrix is singular and cannot be inverted.');
    }
    return [inv];
  }

  protected main(inv: number[][]): number[][] {
    return inv;
  }

  private invertMatrix(mat: number[][]): number[][] | null {
    const n = mat.length;
    // Build augmented matrix [mat | I]
    const aug: number[][] = mat.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);

    for (let col = 0; col < n; col++) {
      // Find pivot row
      let pivotRow = -1;
      let maxVal = 0;
      for (let row = col; row < n; row++) {
        if (Math.abs(aug[row][col]) > maxVal) {
          maxVal = Math.abs(aug[row][col]);
          pivotRow = row;
        }
      }
      if (pivotRow === -1 || Math.abs(aug[pivotRow][col]) < 1e-10) {
        return null; // singular
      }
      [aug[col], aug[pivotRow]] = [aug[pivotRow], aug[col]];

      const pivot = aug[col][col];
      for (let j = 0; j < 2 * n; j++) {
        aug[col][j] /= pivot;
      }
      for (let row = 0; row < n; row++) {
        if (row === col) {
          continue;
        }
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }

    return aug.map((row) => row.slice(n));
  }
}
