import { Sheet, createRegistry, buildInitialCells } from '@gridsheet/engine';
import { fromXlsx, toXlsx } from './index';

// Wire a bare headless Sheet into its registry, mirroring what a framework store
// does, so formulas resolve and toCellMatrix can read the sheet outside a UI.
const headlessSheet = (cells: any) => {
  const registry = createRegistry();
  const sheet = new Sheet({ name: 'Sheet1', registry, eager: true });
  sheet.initialize(cells);
  registry.contextsBySheetId[sheet.id] = {
    store: { sheetReactive: { current: sheet } },
    dispatch: () => {},
  } as any;
  sheet.resolveFormulas();
  return sheet;
};

describe('toXlsx from a live GridSheet sheet', () => {
  it('extracts values and keeps formulas as text (RAW resolution)', () => {
    const sheet = headlessSheet(
      buildInitialCells({
        cells: {
          A1: { value: 10 },
          A2: { value: 20 },
          B1: { value: 'label' },
          B2: { value: '=A1+A2' },
          B3: { value: '=SUM(A1:A2)' },
        },
        ensured: { numRows: 3, numCols: 2 },
      }),
    );

    const parsed = fromXlsx(toXlsx({ Sheet1: sheet }));
    const m = parsed.Sheet1.matrices.A1;

    expect(m[0][0]).toBe(10); // A1
    expect(m[1][0]).toBe(20); // A2
    expect(m[0][1]).toBe('label'); // B1
    expect(m[1][1]).toBe('=A1+A2'); // B2 stays a formula
    expect(m[2][1]).toBe('=SUM(A1:A2)'); // B3 stays a formula
  });

  it('feeds fromXlsx output back into a new sheet that resolves the formulas', () => {
    const source = headlessSheet(
      buildInitialCells({
        cells: { A1: { value: 3 }, A2: { value: 4 }, A3: { value: '=A1*A2' } },
        ensured: { numRows: 3, numCols: 1 },
      }),
    );

    const parsed = fromXlsx(toXlsx({ Sheet1: source }));
    // Reimport: the parsed matrices are exactly buildInitialCells input.
    const reimported = headlessSheet(buildInitialCells(parsed.Sheet1));
    const a3 = reimported.getCell({ y: 3, x: 1 }, { resolution: 'RESOLVED' });
    expect(a3?.value).toBe(12); // formula survived the xlsx round trip and re-evaluates
  });
});
