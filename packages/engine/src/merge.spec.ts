import {
  Sheet,
  createRegistry,
  buildInitialCells,
  toValueMatrix,
  a2p,
  type AreaType,
  type CellsByAddressType,
} from './index';

// Cell merge model: the span lives on the anchor (top-left) cell as `merge: { rows, cols }`;
// covered cells are derived. Structural ops (insert/remove/sort) and undo/redo must keep it coherent.
(globalThis as any).requestAnimationFrame ??= (cb: () => void) => cb();

describe('cell merge', () => {
  const make = (cells: CellsByAddressType = {}, numRows = 6, numCols = 6) => {
    const registry = createRegistry();
    const sheet = new Sheet({ name: 'S', registry });
    sheet.initialize(buildInitialCells({ cells, ensured: { numRows, numCols } }));
    registry.contextsBySheetId[sheet.id] = {
      store: { sheetReactive: { current: sheet } },
      dispatch: () => {},
    } as any;
    sheet.resolveFormulas();
    return sheet;
  };
  const area = (range: string): AreaType => {
    const [s, e = s] = range.split(':');
    const a = a2p(s);
    const b = a2p(e);
    return { top: a.y, left: a.x, bottom: b.y, right: b.x };
  };
  const value = (sheet: Sheet, address: string) => sheet.getCell(a2p(address))?.value;

  describe('merge / unmerge', () => {
    it('merges an area, keeps only the anchor value', () => {
      const sheet = make({ A1: { value: 'a' }, B1: { value: 'b' }, A2: { value: 'c' } });
      sheet.merge({ area: area('A1:B2') });
      expect(sheet.getMerges()).toEqual([area('A1:B2')]);
      expect(sheet.getCell(a2p('A1'))?.merge).toEqual({ rows: 2, cols: 2 });
      expect(value(sheet, 'A1')).toBe('a');
      expect(value(sheet, 'B1')).toBeUndefined();
      expect(value(sheet, 'A2')).toBeUndefined();
      expect(sheet.getMergeAt(a2p('B2'))).toEqual(area('A1:B2'));
      expect(sheet.getMergeAt(a2p('C1'))).toBeUndefined();
    });

    it('is a no-op for a single cell', () => {
      const sheet = make();
      const before = sheet.historySize();
      sheet.merge({ area: area('B2') });
      expect(sheet.getMerges()).toEqual([]);
      expect(sheet.historySize()).toBe(before);
    });

    it('absorbs a partially overlapping merge', () => {
      const sheet = make();
      sheet.merge({ area: area('B2:C3') });
      sheet.merge({ area: area('A1:B2') });
      expect(sheet.getMerges()).toEqual([area('A1:C3')]);
      expect(sheet.getCell(a2p('B2'))?.merge).toBeUndefined();
    });

    it('unmerges every merge intersecting the area', () => {
      const sheet = make({ A1: { value: 'a' } });
      sheet.merge({ area: area('A1:B2') });
      sheet.merge({ area: area('D1:E1') });
      sheet.unmerge({ area: area('B2') });
      expect(sheet.getMerges()).toEqual([area('D1:E1')]);
      expect(value(sheet, 'A1')).toBe('a');
    });

    it('undo restores discarded values, redo re-merges', () => {
      const sheet = make({ A1: { value: 'a' }, B1: { value: 'b' } });
      sheet.merge({ area: area('A1:B1') });
      sheet.undo();
      expect(sheet.getMerges()).toEqual([]);
      expect(value(sheet, 'B1')).toBe('b');
      sheet.redo();
      expect(sheet.getMerges()).toEqual([area('A1:B1')]);
      expect(value(sheet, 'B1')).toBeUndefined();
    });

    it('formulas see covered cells as empty', () => {
      const sheet = make({ A1: { value: 1 }, B1: { value: 2 }, C1: { value: '=SUM(A1:B1)' } });
      expect(value(sheet, 'C1')).toBe(3);
      sheet.merge({ area: area('A1:B1') });
      expect(value(sheet, 'C1')).toBe(1);
    });

    it('reads merges from initial cells', () => {
      const sheet = make({ B2: { value: 'x', merge: { rows: 2, cols: 3 } } });
      expect(sheet.getMerges()).toEqual([area('B2:D3')]);
    });

    it('clamps a merge that overhangs the sheet', () => {
      const sheet = make({ E5: { merge: { rows: 5, cols: 5 } } });
      expect(sheet.getMerges()).toEqual([area('E5:F6')]);
    });
  });

  describe('expandAreaByMerges', () => {
    it('grows until no merge straddles the edge (chained)', () => {
      const sheet = make();
      sheet.merge({ area: area('B1:B2') });
      sheet.merge({ area: area('B3:C3') }); // not touching the first one
      sheet.merge({ area: area('C4:C5') });
      // A2:B3 hits B1:B2 and B3:C3; B3:C3 pulls C3 in, which is still clear of C4:C5.
      expect(sheet.expandAreaByMerges(area('A2:B3'))).toEqual(area('A1:C3'));
      // Reaching row 4 pulls in C4:C5 as well.
      expect(sheet.expandAreaByMerges(area('A2:B4'))).toEqual(area('A1:C5'));
    });

    it('normalizes a reversed area', () => {
      const sheet = make();
      expect(sheet.expandAreaByMerges({ top: 3, left: 3, bottom: 1, right: 1 })).toEqual(area('A1:C3'));
    });
  });

  describe('insert rows / cols', () => {
    it('grows a merge when inserting strictly inside it', () => {
      const sheet = make();
      sheet.merge({ area: area('B2:C4') });
      sheet.insertRows({ y: 3, numRows: 2, baseY: 2 });
      expect(sheet.getMerges()).toEqual([area('B2:C6')]);
      sheet.insertCols({ x: 3, numCols: 1, baseX: 2 });
      expect(sheet.getMerges()).toEqual([area('B2:D6')]);
    });

    it('shifts (not grows) when inserting at the anchor row or below the merge', () => {
      const sheet = make();
      sheet.merge({ area: area('B2:C3') });
      sheet.insertRows({ y: 2, numRows: 1, baseY: 1 });
      expect(sheet.getMerges()).toEqual([area('B3:C4')]);
      sheet.insertRows({ y: 5, numRows: 1, baseY: 4 });
      expect(sheet.getMerges()).toEqual([area('B3:C4')]);
    });

    it('undo / redo of an insert that grew a merge', () => {
      const sheet = make();
      sheet.merge({ area: area('A1:A3') });
      sheet.insertRows({ y: 2, numRows: 1, baseY: 1 });
      expect(sheet.getMerges()).toEqual([area('A1:A4')]);
      sheet.undo();
      expect(sheet.getMerges()).toEqual([area('A1:A3')]);
      sheet.redo();
      expect(sheet.getMerges()).toEqual([area('A1:A4')]);
    });

    it('keeps the grown span when the insert also carries a diff', () => {
      const sheet = make();
      sheet.merge({ area: area('A1:A3') });
      sheet.insertRows({ y: 2, numRows: 1, baseY: 1, diff: { A1: { style: { color: 'red' } } } });
      expect(sheet.getMerges()).toEqual([area('A1:A4')]);
      sheet.undo();
      expect(sheet.getMerges()).toEqual([area('A1:A3')]);
      expect(sheet.getCell(a2p('A1'))?.style?.color).toBeUndefined();
    });
  });

  describe('remove rows / cols', () => {
    it('shrinks a merge when removing inside it, dissolving at 1x1', () => {
      const sheet = make();
      sheet.merge({ area: area('B2:B4') });
      sheet.removeRows({ y: 3, numRows: 1 });
      expect(sheet.getMerges()).toEqual([area('B2:B3')]);
      sheet.removeRows({ y: 3, numRows: 1 });
      expect(sheet.getMerges()).toEqual([]);
      expect(sheet.getCell(a2p('B2'))?.merge).toBeUndefined();
    });

    it('hands the merge to the next surviving cell when the anchor row goes', () => {
      const sheet = make({ B2: { value: 'x', style: { color: 'red' } } });
      sheet.merge({ area: area('B2:C4') });
      sheet.removeRows({ y: 2, numRows: 1 });
      expect(sheet.getMerges()).toEqual([area('B2:C3')]);
      expect(sheet.getCell(a2p('B2'))?.style?.color).toBe('red');
      expect(value(sheet, 'B2')).toBeUndefined(); // the value went with its row
    });

    it('drops a merge removed entirely, and undo brings it back', () => {
      const sheet = make({ B2: { value: 'x' } });
      sheet.merge({ area: area('B2:C3') });
      sheet.removeRows({ y: 1, numRows: 4 });
      expect(sheet.getMerges()).toEqual([]);
      sheet.undo();
      expect(sheet.getMerges()).toEqual([area('B2:C3')]);
      expect(value(sheet, 'B2')).toBe('x');
    });

    it('undo of an anchor-row removal restores the original anchor', () => {
      const sheet = make({ B2: { value: 'x' } });
      sheet.merge({ area: area('B2:B4') });
      sheet.removeRows({ y: 2, numRows: 1 });
      sheet.undo();
      expect(sheet.getMerges()).toEqual([area('B2:B4')]);
      expect(value(sheet, 'B2')).toBe('x');
      expect(sheet.getCell(a2p('B3'))?.merge).toBeUndefined();
      sheet.redo();
      expect(sheet.getMerges()).toEqual([area('B2:B3')]);
    });

    it('shrinks / hands over on column removal', () => {
      const sheet = make();
      sheet.merge({ area: area('B2:D2') });
      sheet.removeCols({ x: 2, numCols: 1 });
      expect(sheet.getMerges()).toEqual([area('B2:C2')]);
      sheet.undo();
      expect(sheet.getMerges()).toEqual([area('B2:D2')]);
    });
  });

  describe('sort / move', () => {
    it('refuses to sort when a merge spans rows, allows single-row merges', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const sheet = make({ A1: { value: 3 }, A2: { value: 1 }, A3: { value: 2 } }, 3, 3);
      sheet.merge({ area: area('B1:B2') });
      sheet.sortRows({ x: 1, direction: 'asc' });
      expect(toValueMatrix(sheet, { area: area('A1:A3') }).flat()).toEqual([3, 1, 2]);

      sheet.unmerge({ area: area('B1') });
      sheet.merge({ area: area('B3:C3') });
      sheet.sortRows({ x: 1, direction: 'asc' });
      expect(toValueMatrix(sheet, { area: area('A1:A3') }).flat()).toEqual([1, 2, 3]);
      expect(sheet.getMerges()).toEqual([area('B2:C2')]); // travelled with its row
      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });

    it('moves a whole merge with its anchor; undo moves it back', () => {
      const sheet = make({ A1: { value: 'a' } });
      sheet.merge({ area: area('A1:B2') });
      sheet.move({ src: area('A1:B2'), dst: area('D4:E5') });
      expect(sheet.getMerges()).toEqual([area('D4:E5')]);
      expect(value(sheet, 'D4')).toBe('a');
      sheet.undo();
      expect(sheet.getMerges()).toEqual([area('A1:B2')]);
    });

    it('moves a merge across sheets', () => {
      const registry = createRegistry();
      const mk = (name: string) => {
        const s = new Sheet({ name, registry });
        s.id = ++registry.sheetHead;
        s.initialize(buildInitialCells({ ensured: { numRows: 4, numCols: 4 } }));
        registry.contextsBySheetId[s.id] = { store: { sheetReactive: { current: s } }, dispatch: () => {} } as any;
        return s;
      };
      const src = mk('src');
      const dst = mk('dst');
      src.merge({ area: area('A1:B1') });
      dst.move({ srcSheet: src, src: area('A1:B1'), dst: area('C3:D3') });
      expect(src.getMerges()).toEqual([]);
      expect(dst.getMerges()).toEqual([area('C3:D3')]);
      dst.undo();
      expect(src.getMerges()).toEqual([area('A1:B1')]);
      expect(dst.getMerges()).toEqual([]);
    });
  });
});
