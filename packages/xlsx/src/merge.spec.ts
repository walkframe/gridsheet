import { Sheet, createRegistry, buildInitialCells } from '@gridsheet/engine';
import { fromXlsx, toXlsx } from './index';
import { readZip } from './zip';

// Merged ranges: GridSheet keeps the span on the anchor cell (merge: { rows, cols });
// xlsx keeps <mergeCells><mergeCell ref="A1:C2"/></mergeCells> after <sheetData>.
const headlessSheet = (cells: any) => {
  const registry = createRegistry();
  const sheet = new Sheet({ name: 'Sheet1', registry });
  sheet.initialize(cells);
  registry.contextsBySheetId[sheet.id] = {
    store: { sheetReactive: { current: sheet } },
    dispatch: () => {},
  } as any;
  return sheet;
};

const sheetXml = (bytes: Uint8Array) => readZip(bytes)['xl/worksheets/sheet1.xml'];

describe('merged cells in xlsx', () => {
  it('writes merges from a live sheet as <mergeCells> after <sheetData>', () => {
    const sheet = headlessSheet(
      buildInitialCells({
        cells: { A1: { value: 'Title', merge: { rows: 1, cols: 3 } }, B3: { value: 'x', merge: { rows: 2, cols: 2 } } },
        ensured: { numRows: 5, numCols: 4 },
      }),
    );
    const xml = sheetXml(toXlsx({ Sheet1: sheet }));
    expect(xml).toContain('<mergeCells count="2"><mergeCell ref="A1:C1"/><mergeCell ref="B3:C4"/></mergeCells>');
    expect(xml.indexOf('</sheetData>')).toBeLessThan(xml.indexOf('<mergeCells'));
  });

  it('writes no <mergeCells> element when nothing is merged', () => {
    const xml = sheetXml(toXlsx({ Sheet1: [['a', 'b']] }));
    expect(xml).not.toContain('mergeCell');
  });

  it('round-trips merges through toXlsx → fromXlsx → a new sheet', () => {
    const original = headlessSheet(
      buildInitialCells({
        cells: { A1: { value: 'Title', merge: { rows: 1, cols: 3 } }, B3: { value: 'x', merge: { rows: 2, cols: 2 } } },
        ensured: { numRows: 5, numCols: 4 },
      }),
    );
    const parsed = fromXlsx(toXlsx({ Sheet1: original })).Sheet1;
    expect(parsed.cells.A1?.merge).toEqual({ rows: 1, cols: 3 });
    expect(parsed.cells.B3?.merge).toEqual({ rows: 2, cols: 2 });

    const restored = headlessSheet(buildInitialCells(parsed));
    expect(restored.getMerges()).toEqual(original.getMerges());
  });

  it('sizes the sheet to cover a merge that extends past the last value', () => {
    // An empty, merged block at the bottom-right: the matrix must still reach C4.
    const parsed = fromXlsx(
      toXlsx({
        Sheet1: [
          [{ value: 'a' }, null, null],
          [null, null, null],
          [null, null, { value: null, merge: { rows: 2, cols: 1 } } as any],
        ],
      }),
    ).Sheet1;
    expect(parsed.cells.C3?.merge).toEqual({ rows: 2, cols: 1 });
    const m = parsed.matrices.A1;
    expect(m.length).toBe(4);
    expect(m[0].length).toBe(3);
  });

  it('keeps merges from a cell matrix input too', () => {
    const xml = sheetXml(toXlsx({ Sheet1: [[{ value: 'Head', merge: { rows: 1, cols: 2 } } as any, null]] }));
    expect(xml).toContain('<mergeCell ref="A1:B1"/>');
  });
});
