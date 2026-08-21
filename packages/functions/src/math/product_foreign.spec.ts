import { ProductFunction } from './product';
import { SumsqFunction } from './sumsq';

// Simulates a Sheet instance that comes from a DIFFERENT bundled copy of
// @gridsheet/engine than the one @gridsheet/functions imports. It duck-types as
// a Sheet (__gsType === 'Sheet', the codebase's cross-copy marker) but is NOT
// `instanceof` the engine's Sheet class — exactly what happens in the VS Code
// webview bundle, which contains two copies of the engine (two Sheet classes).
class ForeignSheet {
  public __gsType = 'Sheet';
  constructor(private matrix: any[][]) {}
  get hasSingleCell() {
    return this.matrix.length === 1 && this.matrix[0].length === 1;
  }
  get shape() {
    return { rows: this.matrix.length, cols: this.matrix[0].length };
  }
  solve() {
    return this.matrix;
  }
  _toValueMatrix() {
    return this.matrix;
  }
  strip() {
    return this.matrix[0][0];
  }
}

const entity = (v: any) => ({ evaluate: () => v }) as any;

describe('extended functions with a foreign (cross-bundle) Sheet', () => {
  it('PRODUCT multiplies foreign 1x1 sheet cell values', () => {
    const f = new ProductFunction({
      sheet: {} as any,
      args: [entity(new ForeignSheet([[113]])), entity(new ForeignSheet([[904]]))],
    });
    expect(f.call()).toBe(113 * 904);
  });

  it('SUMSQ sums squares of foreign sheet cell values', () => {
    const f = new SumsqFunction({
      sheet: {} as any,
      args: [entity(new ForeignSheet([[3]])), entity(new ForeignSheet([[4]]))],
    });
    expect(f.call()).toBe(9 + 16);
  });
});
