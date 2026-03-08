import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition, eachMatrix } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the probability associated with a Student's t-test.
tails: 1 (one-tailed) or 2 (two-tailed).
type: 1 (paired), 2 (two-sample equal variance), 3 (two-sample unequal variance).`;

/** Regularized incomplete beta function via continued fraction (Lentz's method). */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x >= 1) {
    return 1;
  }
  // Use symmetry relation when x > (a+1)/(a+b+2)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - incompleteBeta(1 - x, b, a);
  }
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  // Continued fraction via modified Lentz
  const MAXIT = 200;
  const EPS = 3e-7;
  let f = 1,
    C = 1,
    D = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(D) < 1e-30) {
    D = 1e-30;
  }
  D = 1 / D;
  f = D;
  for (let m = 1; m <= MAXIT; m++) {
    // Even step
    let d = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    D = 1 + d * D;
    if (Math.abs(D) < 1e-30) {
      D = 1e-30;
    }
    C = 1 + d / C;
    if (Math.abs(C) < 1e-30) {
      C = 1e-30;
    }
    D = 1 / D;
    f *= D * C;
    // Odd step
    d = (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    D = 1 + d * D;
    if (Math.abs(D) < 1e-30) {
      D = 1e-30;
    }
    C = 1 + d / C;
    if (Math.abs(C) < 1e-30) {
      C = 1e-30;
    }
    D = 1 / D;
    const delta = D * C;
    f *= delta;
    if (Math.abs(delta - 1) < EPS) {
      break;
    }
  }
  return front * f;
}

function lgamma(z: number): number {
  // Lanczos approximation
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  }
  z--;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Two-tailed p-value for t-distribution with df degrees of freedom. */
function tDist2T(t: number, df: number): number {
  const x = df / (df + t * t);
  return incompleteBeta(x, df / 2, 0.5);
}

export class TTestFunction extends BaseFunction {
  example = 'T.TEST(A1:A100, B1:B100, 2, 2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'range1', description: 'The first sample of data.', takesMatrix: true, acceptedTypes: ['matrix'] },
    { name: 'range2', description: 'The second sample of data.', takesMatrix: true, acceptedTypes: ['matrix'] },
    { name: 'tails', description: 'The number of distribution tails: 1 or 2.', acceptedTypes: ['number'] },
    {
      name: 'type',
      description: 'The type of t-test: 1 (paired), 2 (equal variance), 3 (unequal variance).',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'statistics';

  protected validate(args: any[]): any[] {
    const t = Math.floor(ensureNumber(args[2]));
    const tp = Math.floor(ensureNumber(args[3]));
    if (t !== 1 && t !== 2) {
      throw new FormulaError('#NUM!', 'tails must be 1 or 2.');
    }
    if (tp < 1 || tp > 3) {
      throw new FormulaError('#NUM!', 'type must be 1, 2, or 3.');
    }

    const a: number[] = [];
    const b: number[] = [];
    eachMatrix(
      args[0],
      (v: any) => {
        if (v == null || v === '' || typeof v === 'boolean') {
          return;
        }
        a.push(ensureNumber(v));
      },
      this.at,
    );
    eachMatrix(
      args[1],
      (v: any) => {
        if (v == null || v === '' || typeof v === 'boolean') {
          return;
        }
        b.push(ensureNumber(v));
      },
      this.at,
    );

    if (tp === 1) {
      if (a.length !== b.length || a.length < 2) {
        throw new FormulaError('#N/A', 'Paired T.TEST requires equal-length ranges with at least 2 values.');
      }
    } else {
      if (a.length < 2 || b.length < 2) {
        throw new FormulaError('#DIV/0!', `T.TEST type ${tp} requires at least 2 values per range.`);
      }
    }
    return [a, b, t, tp];
  }

  protected main(a: number[], b: number[], t: number, tp: number) {
    let tStat: number;
    let df: number;

    if (tp === 1) {
      // Paired
      const diffs = a.map((v, i) => v - b[i]);
      const n = diffs.length;
      const meanD = diffs.reduce((s, v) => s + v, 0) / n;
      const varD = diffs.reduce((s, v) => s + (v - meanD) ** 2, 0) / (n - 1);
      tStat = meanD / Math.sqrt(varD / n);
      df = n - 1;
    } else if (tp === 2) {
      // Two-sample equal variance (pooled)
      const meanA = a.reduce((s, v) => s + v, 0) / a.length;
      const meanB = b.reduce((s, v) => s + v, 0) / b.length;
      const varA = a.reduce((s, v) => s + (v - meanA) ** 2, 0) / (a.length - 1);
      const varB = b.reduce((s, v) => s + (v - meanB) ** 2, 0) / (b.length - 1);
      const pooled = ((a.length - 1) * varA + (b.length - 1) * varB) / (a.length + b.length - 2);
      tStat = (meanA - meanB) / Math.sqrt(pooled * (1 / a.length + 1 / b.length));
      df = a.length + b.length - 2;
    } else {
      // Two-sample unequal variance (Welch)
      const meanA = a.reduce((s, v) => s + v, 0) / a.length;
      const meanB = b.reduce((s, v) => s + v, 0) / b.length;
      const varA = a.reduce((s, v) => s + (v - meanA) ** 2, 0) / (a.length - 1);
      const varB = b.reduce((s, v) => s + (v - meanB) ** 2, 0) / (b.length - 1);
      const sA = varA / a.length;
      const sB = varB / b.length;
      tStat = (meanA - meanB) / Math.sqrt(sA + sB);
      df = (sA + sB) ** 2 / (sA ** 2 / (a.length - 1) + sB ** 2 / (b.length - 1));
    }

    const p2 = tDist2T(Math.abs(tStat), df);
    return t === 1 ? p2 / 2 : p2;
  }
}
