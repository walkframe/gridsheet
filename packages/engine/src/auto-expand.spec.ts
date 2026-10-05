import { Sheet, createRegistry, buildInitialCells, Autofill } from './index';
import type { AutoExpandType, SheetLimits } from './index';

// autoExpand: a paste / autofill that runs past the sheet's edge appends the missing rows/cols
// (per direction, capped by maxRows/maxCols) and the growth undoes together with the write.
describe('autoExpand', () => {
  const make = (autoExpand: AutoExpandType, limits?: SheetLimits, numRows = 3, numCols = 3) => {
    const registry = createRegistry();
    const cells = buildInitialCells({
      matrices: {
        A1: [
          ['a1', 'b1'],
          ['a2', 'b2'],
        ],
      },
      ensured: { numRows, numCols },
    });
    const sheet = new Sheet({ name: 'S', registry, autoExpand, limits });
    sheet.initialize(cells);
    registry.contextsBySheetId[sheet.id] = {
      store: { sheetReactive: { current: sheet } },
      dispatch: () => {},
    } as any;
    return sheet;
  };
  const value = (sheet: Sheet, y: number, x: number) => sheet.getCell({ y, x })?.value;
  // A1:B2 pasted at C3 needs rows 3..4 and cols 3..4 on a 3x3 sheet.
  const pasteA1B2AtC3 = (sheet: Sheet) =>
    sheet.copy({ src: { top: 1, left: 1, bottom: 2, right: 2 }, dst: { top: 3, left: 3, bottom: 4, right: 4 } });

  it("clips the overflow with 'none' (default behavior)", () => {
    const sheet = make('none');
    pasteA1B2AtC3(sheet);
    expect([sheet.numRows, sheet.numCols]).toEqual([3, 3]);
    expect(value(sheet, 3, 3)).toBe('a1');
  });

  it.each<[AutoExpandType, number, number]>([
    ['vertical', 4, 3],
    ['horizontal', 3, 4],
    ['both', 4, 4],
  ])("grows the sheet per direction with '%s'", (mode, rows, cols) => {
    const sheet = make(mode);
    pasteA1B2AtC3(sheet);
    expect([sheet.numRows, sheet.numCols]).toEqual([rows, cols]);
    expect(value(sheet, 3, 3)).toBe('a1');
    if (mode === 'both') {
      expect(value(sheet, 4, 4)).toBe('b2');
    }
  });

  it('undoes the growth and the paste in one step, and redoes both', () => {
    const sheet = make('both');
    const historyCount = sheet.registry.histories.length;
    pasteA1B2AtC3(sheet);
    expect(sheet.registry.histories.length).toBe(historyCount + 1);
    expect(sheet.registry.histories.at(-1)?.operation).toBe('BATCH');

    sheet.undo();
    expect([sheet.numRows, sheet.numCols]).toEqual([3, 3]);
    expect(value(sheet, 3, 3)).toBeFalsy();

    sheet.redo();
    expect([sheet.numRows, sheet.numCols]).toEqual([4, 4]);
    expect(value(sheet, 3, 3)).toBe('a1');
    expect(value(sheet, 4, 4)).toBe('b2');
  });

  it('records a plain history (no BATCH) when nothing overflows', () => {
    const sheet = make('both');
    sheet.copy({ src: { top: 1, left: 1, bottom: 1, right: 1 }, dst: { top: 3, left: 3, bottom: 3, right: 3 } });
    expect(sheet.registry.histories.at(-1)?.operation).toBe('UPDATE');
  });

  it('stops at maxRows / maxCols and clips the rest', () => {
    const sheet = make('both', { maxRows: 4, maxCols: 3 });
    sheet.copy({ src: { top: 1, left: 1, bottom: 2, right: 2 }, dst: { top: 3, left: 2, bottom: 6, right: 3 } });
    expect([sheet.numRows, sheet.numCols]).toEqual([4, 3]);
    expect(value(sheet, 4, 3)).toBe('b2');
  });

  it('grows for an external matrix write (writeRawCellMatrix)', () => {
    const sheet = make('vertical');
    sheet.writeRawCellMatrix({
      point: { y: 3, x: 1 },
      matrix: [[{ value: 'x' }], [{ value: 'y' }], [{ value: 'z' }]],
    });
    expect(sheet.numRows).toBe(5);
    expect(value(sheet, 5, 1)).toBe('z');
    sheet.undo();
    expect(sheet.numRows).toBe(3);
  });

  it('grows for a cut-paste (move)', () => {
    const sheet = make('vertical');
    sheet.move({ src: { top: 1, left: 1, bottom: 2, right: 1 }, dst: { top: 3, left: 1, bottom: 4, right: 1 } });
    expect(sheet.numRows).toBe(4);
    expect(value(sheet, 4, 1)).toBe('a2');
    sheet.undo();
    expect(sheet.numRows).toBe(3);
    expect(value(sheet, 2, 1)).toBe('a2');
  });

  it('takes the growth back when the operation is refused (move cutting through a merge)', () => {
    const sheet = make('vertical');
    sheet.merge({ area: { top: 1, left: 1, bottom: 2, right: 2 } });
    const historyCount = sheet.registry.histories.length;
    // The source cuts through the A1:B2 merge, so the move is refused after the sheet grew.
    sheet.move({ src: { top: 2, left: 1, bottom: 2, right: 1 }, dst: { top: 3, left: 1, bottom: 5, right: 1 } });
    expect(sheet.numRows).toBe(3);
    expect(sheet.registry.histories.length).toBe(historyCount);
  });

  it('grows for an autofill dragged past the last row, clamping to the limit', () => {
    const sheet = make('vertical', { maxRows: 6 });
    const store = {
      sheetReactive: { current: sheet },
      choosing: { y: 1, x: 1 },
      selectingZone: { startY: 1, startX: 1, endY: 2, endX: 1 },
    };
    new Autofill(store, { y: 10, x: 1 }).applied;
    expect(sheet.numRows).toBe(6);
    expect(value(sheet, 6, 1)).toBe('a6'); // the series continues a1, a2 → a3..a6
    sheet.undo();
    expect(sheet.numRows).toBe(3);
  });

  it('ignores the column direction for a vertical-only sheet when filling right', () => {
    const sheet = make('vertical');
    const store = {
      sheetReactive: { current: sheet },
      choosing: { y: 1, x: 1 },
      selectingZone: { startY: 1, startX: 1, endY: 1, endX: 1 },
    };
    new Autofill(store, { y: 1, x: 8 }).applied;
    expect(sheet.numCols).toBe(3);
  });
});
