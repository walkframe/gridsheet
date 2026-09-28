import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Sheet, createRegistry, buildInitialCells } from '@gridsheet/engine';
import { fromXlsx, toXlsx } from './index';
import type { ParsedWorkbook } from './types';

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

  it('resolves cross-sheet references after importing a multi-sheet workbook', () => {
    // Wire every imported sheet into ONE shared registry (like a spellbook `book`),
    // giving each a unique id the way <GridSheet> does, so cross-sheet refs resolve.
    const parsed: ParsedWorkbook = fromXlsx(readFileSync(join(__dirname, '__fixtures__', 'complex.xlsx')));
    const registry = createRegistry();
    const sheets: Record<string, Sheet> = {};
    for (const [name, data] of Object.entries(parsed)) {
      const sheet = new Sheet({ name, registry, eager: true });
      sheet.id = ++registry.sheetHead;
      sheet.initialize(buildInitialCells(data));
      registry.contextsBySheetId[sheet.id] = {
        store: { sheetReactive: { current: sheet } },
        dispatch: () => {},
      } as any;
      sheets[name] = sheet;
    }
    registry.boot();

    const summary = sheets.Summary;
    // =SUM(Sales!D3:D5) — Sales' own =B*C formulas resolve first, then this sums them.
    expect(summary.getCell({ y: 2, x: 2 }, { resolution: 'RESOLVED' })?.value).toBe(17);
    // =Sales!D3 (=B3*C3 = 3 * 1.5)
    expect(summary.getCell({ y: 3, x: 2 }, { resolution: 'RESOLVED' })?.value).toBe(4.5);
    // =Sales!D6 * 'Meta Data'!B3 — quoted spaced sheet name, 17 * 0.153
    expect(summary.getCell({ y: 4, x: 2 }, { resolution: 'RESOLVED' })?.value).toBeCloseTo(2.601);
  });

  it('round-trips cell styles and header sizes through toXlsx → fromXlsx', () => {
    const sheet = headlessSheet(
      buildInitialCells({
        cells: {
          A1: {
            value: 'Title',
            style: { backgroundColor: '#203864', color: '#FFFFFF', fontWeight: 'bold' },
            justifyContent: 'center',
          },
          A2: { value: 'note', style: { fontStyle: 'italic', textDecoration: 'underline' } },
          A0: { width: 160 }, // column A header width (px)
          '01': { height: 40 }, // row 1 header height (px)
        },
        ensured: { numRows: 2, numCols: 1 },
      }),
    );

    const cells = fromXlsx(toXlsx({ Sheet1: sheet })).Sheet1.cells;

    expect(cells.A1.style).toMatchObject({
      backgroundColor: '#203864',
      color: '#FFFFFF',
      fontWeight: 'bold',
    });
    expect(cells.A1.justifyContent).toBe('center');
    expect(cells.A2.style).toMatchObject({ fontStyle: 'italic', textDecoration: 'underline' });
    // Sizes round-trip through the px↔xlsx-unit conversion (approximately).
    expect(cells.A0.width).toBeGreaterThanOrEqual(155);
    expect(cells.A0.width).toBeLessThanOrEqual(165);
    expect(cells['01'].height).toBe(40);
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
