import { FormulaError } from '@gridsheet/core';
import type { FunctionArgumentDefinition } from '@gridsheet/core';
import { MatrixFunction } from './__matrix_base';

const description = `Returns the matrix product of two matrices.
The number of columns in matrix1 must equal the number of rows in matrix2.`;

export class MmultFunction extends MatrixFunction {
  autoSpilling = true;
  example = 'MMULT(A1:B2, C1:D2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'matrix1', description: 'First matrix.', takesMatrix: true, acceptedTypes: ['matrix'] },
    { name: 'matrix2', description: 'Second matrix.', takesMatrix: true, acceptedTypes: ['matrix'] },
  ];

  protected validate(args: any[]): any[] {
    if (args.length !== 2) {
      throw new FormulaError('#N/A', 'MMULT requires exactly 2 arguments.');
    }
    const matA = this.extractNumberMatrix(args[0], 'matrix1');
    const matB = this.extractNumberMatrix(args[1], 'matrix2');

    const colsA = matA[0].length;
    const rowsB = matB.length;
    if (colsA !== rowsB) {
      throw new FormulaError(
        '#VALUE!',
        `MMULT: number of columns in matrix1 (${colsA}) must equal number of rows in matrix2 (${rowsB}).`,
      );
    }
    return [matA, matB];
  }

  protected main(matA: number[][], matB: number[][]): number[][] {
    const rowsA = matA.length;
    const colsA = matA[0].length;
    const colsB = matB[0].length;
    const result: number[][] = [];
    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += matA[i][k] * matB[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }
}
