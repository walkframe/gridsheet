import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/core';
import { ensureNumber, isNumeric } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the correlation coefficient of two datasets.`;

export class CorrelFunction extends BaseFunction {
  example = 'CORREL(A1:A100, B1:B100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'data_y',
      description: 'The range representing the dependent data.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
    {
      name: 'data_x',
      description: 'The range representing the independent data.',
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
      throw new FormulaError('#N/A', 'CORREL requires two ranges of equal length with at least 2 values.');
    }
    return [ys, xs];
  }

  protected main(ys: number[], xs: number[]) {
    const n = ys.length;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;

    let num = 0,
      denY = 0,
      denX = 0;
    for (let i = 0; i < n; i++) {
      const dy = ys[i] - meanY;
      const dx = xs[i] - meanX;
      num += dy * dx;
      denY += dy * dy;
      denX += dx * dx;
    }
    const den = Math.sqrt(denY * denX);
    if (den === 0) {
      throw new FormulaError('#DIV/0!', 'Standard deviation of one dataset is zero.');
    }
    return num / den;
  }
}
