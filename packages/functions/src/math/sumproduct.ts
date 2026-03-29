import { FormulaError } from '@gridsheet/core';
import type { FunctionArgumentDefinition } from '@gridsheet/core';
import { MatrixFunction } from './__matrix_base';

const description = `Returns the sum of the products of corresponding array elements.
All arrays must have the same dimensions.`;

export class SumproductFunction extends MatrixFunction {
  example = 'SUMPRODUCT(A1:A3, B1:B3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'array1', description: 'First array.', takesMatrix: true, acceptedTypes: ['matrix'] },
    { name: 'array2', description: 'Additional arrays.', takesMatrix: true, acceptedTypes: ['matrix'], variadic: true },
  ];

  protected validate(args: any[]): any[] {
    if (args.length < 1) {
      throw new FormulaError('#N/A', 'SUMPRODUCT requires at least 1 argument.');
    }
    const matrices = args.map((arg, i) => this.extractNumberMatrix(arg, `array${i + 1}`));
    const rows = matrices[0].length;
    const cols = matrices[0][0].length;
    for (let i = 1; i < matrices.length; i++) {
      if (matrices[i].length !== rows || matrices[i][0].length !== cols) {
        throw new FormulaError('#VALUE!', 'SUMPRODUCT: all arrays must have the same dimensions.');
      }
    }
    return [matrices];
  }

  protected main(matrices: number[][][]): number {
    const rows = matrices[0].length;
    const cols = matrices[0][0].length;
    let sum = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let product = 1;
        for (const mat of matrices) {
          product *= mat[r][c];
        }
        sum += product;
      }
    }
    return sum;
  }
}
