import { BaseFunction } from '@gridsheet/core';
import { FormulaError, eachMatrix, ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

/**
 * Common base class for matrix functions (MMULT, TRANSPOSE, MINVERSE, MDETERM).
 *
 * Provides:
 * - `extractNumberMatrix()` to convert a Sheet/Spilling/2D-array arg into number[][]
 */
export abstract class MatrixFunction extends BaseFunction {
  category: FunctionCategory = 'math';

  /** Convert a matrix argument to a 2D number array using eachMatrix. */
  protected extractNumberMatrix(value: any, argName: string): number[][] {
    const matrix: number[][] = [];
    eachMatrix(
      value,
      (v: any, { y, x }) => {
        if (!matrix[y]) {
          matrix[y] = [];
        }
        matrix[y][x] = ensureNumber(v);
      },
      this.at,
    );
    if (matrix.length === 0) {
      throw new FormulaError('#VALUE!', `${argName} must be a non-empty matrix.`);
    }
    return matrix;
  }

  /** Require the matrix to be square. Throws if not. */
  protected requireSquare(matrix: number[][], funcName: string): void {
    const n = matrix.length;
    if (matrix.some((row) => row.length !== n)) {
      throw new FormulaError('#VALUE!', `${funcName} requires a square matrix.`);
    }
  }
}
