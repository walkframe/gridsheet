import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the population covariance, the average of the products of deviations for each data point pair in two datasets.`;

export class CovariancePFunction extends BaseFunction {
  example = 'COVARIANCE.P(A1:A100, B1:B100)';
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
        if (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))) {
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
        if (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))) {
          xs.push(ensureNumber(v));
        }
      },
      this.at,
    );
    if (ys.length !== xs.length || ys.length < 1) {
      throw new FormulaError('#N/A', 'COVARIANCE.P requires two ranges of equal length with at least 1 value.');
    }
    return [ys, xs];
  }

  protected main(ys: number[], xs: number[]) {
    const n = ys.length;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    return ys.reduce((acc, y, i) => acc + (y - meanY) * (xs[i] - meanX), 0) / n;
  }
}
