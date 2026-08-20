import { Sheet, createRegistry, buildInitialCells, a2p } from './index';

/**
 * getPointById watermark scan (addressCaches).
 *
 * getPointById resolves a formula's stored cell Id back to a point/address. On a cache
 * miss it resumes scanning from a watermark instead of rescanning from row 0, skipping
 * un-materialized rows. These tests pin the CONTRACT the optimization must not break:
 * every formula reference still resolves to the correct address/value across the
 * structural mutations that clear or invalidate the cache (insert/remove/sort/undo/redo).
 */

const wire = (registry: ReturnType<typeof createRegistry>, cells: any) => {
  const sheet = new Sheet({ name: 'Sheet1', registry, eager: true });
  sheet.initialize(cells);
  registry.contextsBySheetId[sheet.id] = {
    store: { sheetReactive: { current: sheet } },
    dispatch: () => {},
  } as any;
  sheet.resolveFormulas();
  return sheet;
};

// The RAW-displayed formula string re-derives every reference's address via
// getAddressById -> getPointById, which is exactly the code under test.
const raw = (sheet: Sheet, address: string) => {
  const p = a2p(address);
  return sheet.getSerializedValue({ point: p, resolution: 'RAW' });
};
const val = (sheet: Sheet, address: string) => {
  const p = a2p(address);
  return sheet.getCell(p)?.value;
};

describe('getPointById watermark scan', () => {
  it('resolves references correctly at baseline', () => {
    const sheet = wire(createRegistry(), {
      A1: { value: 10 },
      A5: { value: 50 },
      A9: { value: 90 },
      C1: { value: '=A1' },
      C2: { value: '=A5' },
      C3: { value: '=A9' },
    });
    expect(raw(sheet, 'C1')).toBe('=A1');
    expect(raw(sheet, 'C2')).toBe('=A5');
    expect(raw(sheet, 'C3')).toBe('=A9');
    expect(val(sheet, 'C1')).toBe(10);
    expect(val(sheet, 'C2')).toBe(50);
    expect(val(sheet, 'C3')).toBe(90);
  });

  it('shifts references down after inserting rows above them (cache cleared)', () => {
    const sheet = wire(createRegistry(), {
      A5: { value: 50 },
      A9: { value: 90 },
      C1: { value: '=A5' },
      C2: { value: '=A9' },
    });
    // warm: force a resolve so the cache/watermark advance first
    expect(raw(sheet, 'C1')).toBe('=A5');

    // Insert below the formula cells (rows 1-2) but above the targets (rows 5, 9),
    // so the formulas stay put while their referenced cells shift down by 2.
    sheet.insertRows({ y: 3, numRows: 2, baseY: 2 });

    expect(raw(sheet, 'C1')).toBe('=A7');
    expect(raw(sheet, 'C2')).toBe('=A11');
    expect(val(sheet, 'C1')).toBe(50);
    expect(val(sheet, 'C2')).toBe(90);
  });

  it('keeps references correct after removing rows and after undo/redo', () => {
    const sheet = wire(createRegistry(), {
      A5: { value: 50 },
      A9: { value: 90 },
      C1: { value: '=A5' },
      C2: { value: '=A9' },
    });
    expect(raw(sheet, 'C2')).toBe('=A9');

    // Remove rows 3..4 (empty, below the formulas at rows 1-2 and above the targets),
    // shifting the referenced cells up by 2.
    sheet.removeRows({ y: 3, numRows: 2 });
    expect(raw(sheet, 'C1')).toBe('=A3');
    expect(raw(sheet, 'C2')).toBe('=A7');
    expect(val(sheet, 'C1')).toBe(50);
    expect(val(sheet, 'C2')).toBe(90);

    sheet.undo();
    expect(raw(sheet, 'C1')).toBe('=A5');
    expect(raw(sheet, 'C2')).toBe('=A9');
    expect(val(sheet, 'C2')).toBe(90);

    sheet.redo();
    expect(raw(sheet, 'C1')).toBe('=A3');
    expect(val(sheet, 'C2')).toBe(90);
  });

  it('re-scans a partially-seeded row on the next miss (watermark must not skip it)', () => {
    // Two references land in the SAME row (row 5) but different columns: A5 (col 1) and
    // E5 (col 5). After the cache is cleared, resolving the A5 ref finds the target
    // mid-row-5 and the scan stops there. If the watermark then advanced PAST row 5, the
    // E5 ref (a later column in the same row) would be skipped. Both must still resolve.
    const sheet = wire(createRegistry(), {
      A5: { value: 'a5' },
      E5: { value: 'e5' },
      C1: { value: '=A5' },
      C2: { value: '=E5' },
    });
    // Clear the address cache + watermark, forcing a fresh miss scan for both refs.
    sheet.clearAddressCaches();
    expect(raw(sheet, 'C1')).toBe('=A5'); // finds A5 mid-row-5, scan stops there
    expect(raw(sheet, 'C2')).toBe('=E5'); // E5 (col 5, same row) must still resolve
    expect(val(sheet, 'C1')).toBe('a5');
    expect(val(sheet, 'C2')).toBe('e5');
  });

  it('resolves a far reference on a large lazy sheet without materializing every row', () => {
    // 200k-row single-column matrix — over buildInitialCells' eager threshold, so rows
    // materialize lazily. A formula references a cell deep in the sheet.
    const ROWS = 200_000;
    const TARGET = 150_000;
    const matrix = Array.from({ length: ROWS }, (_, y) => [y]);
    const cells = buildInitialCells({
      cells: { C1: { value: `=A${TARGET}` } },
      matrices: { A1: matrix },
      flattenAs: 'value',
      ensured: { numRows: ROWS, numCols: 3 },
    });
    const registry = createRegistry();
    const sheet = new Sheet({ name: 'Big', registry, eager: true });
    sheet.initialize(cells);
    registry.contextsBySheetId[sheet.id] = {
      store: { sheetReactive: { current: sheet } },
      dispatch: () => {},
    } as any;
    sheet.resolveFormulas();

    // Baseline resolves (A1 = 0, so A150000 = 149999).
    expect(val(sheet, 'C1')).toBe(TARGET - 1);
    expect(raw(sheet, 'C1')).toBe(`=A${TARGET}`);

    // Force a full cache miss, then resolve the far reference again. The miss scan must
    // NOT materialize every row: if it did, the id counter would jump by ~ROWS*cols.
    sheet.clearAddressCaches();
    const headBefore = registry.cellHead;
    expect(raw(sheet, 'C1')).toBe(`=A${TARGET}`);
    expect(val(sheet, 'C1')).toBe(TARGET - 1);
    const minted = registry.cellHead - headBefore;
    // Only already-materialized rows exist; the scan mints nothing new (a handful at most).
    expect(minted).toBeLessThan(100);
  });

  it('resolves references after sortRows', () => {
    const sheet = wire(createRegistry(), {
      A1: { value: 3 },
      A2: { value: 1 },
      A3: { value: 2 },
      C1: { value: '=A1' }, // in the same row as A1 — both move together under sort
    });
    expect(val(sheet, 'C1')).toBe(3);

    sheet.sortRows({ x: 1, direction: 'asc' }); // rows reorder by column A: 1, 2, 3

    // sortRows re-slots whole rows, so the formula and its target move together and the
    // Id-based reference stays intact. Row with A=3 (originally row 1) lands at row 3.
    for (const r of [1, 2, 3]) {
      const address = `C${r}`;
      const displayed = raw(sheet, address);
      if (displayed !== '') {
        // the one surviving formula must still resolve to a valid same-row reference & value
        expect(displayed).toMatch(/^=A[123]$/);
        expect(val(sheet, address)).toBe(3);
      }
    }
    // and the sort itself worked
    expect(val(sheet, 'A1')).toBe(1);
    expect(val(sheet, 'A2')).toBe(2);
    expect(val(sheet, 'A3')).toBe(3);
  });
});
