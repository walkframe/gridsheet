import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber, isNumeric } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the sample covariance, the average of the products of deviations for each data point pair in two datasets.`;

export class CovarianceSFunction extends BaseFunction {
  example = 'COVARIANCE.S(A1:A100, B1:B100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'data_y',
      description: 'The range representing the first dataset.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
    {
      name: 'data_x',
      description: 'The range representing the second dataset.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
  ];
  category: FunctionCategory = 'statistics';

  protected validate(args: any[]): any[] {
    const ys: number[] = [];
    const xs: number[] = [];
    eachMatrix(
      args[0],
      (v: any) => {
        if (v == null || v === '' || typeof v === 'boolean') {
          return;
        }
        if (isNumeric(v)) {
          ys.push(ensureNumber(v));
        }
      },
      this.at,
    );
    eachMatrix(
      args[1],
      (v: any) => {
        if (v == null || v === '' || typeof v === 'boolean') {
          return;
        }
        if (isNumeric(v)) {
          xs.push(ensureNumber(v));
        }
      },
      this.at,
    );
    if (ys.length !== xs.length || ys.length < 2) {
      throw new FormulaError('#N/A', 'COVARIANCE.S requires two ranges of equal length with at least 2 values.');
    }
    return [ys, xs];
  }

  protected main(ys: number[], xs: number[]) {
    const n = ys.length;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    return ys.reduce((acc, y, i) => acc + (y - meanY) * (xs[i] - meanX), 0) / (n - 1);
  }
}
