import { SheetFunction } from './sheet';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('sheet', () => {
  const sheet = new Sheet({});
  sheet.sheetId = 2;
  sheet.initialize({});
  sheet.wire = {
    sheetIdsByName: {
      Sheet1: 1,
      Sheet2: 2,
      Sheet3: 3,
    },
  } as any;

  describe('normal', () => {
    it('returns current sheet index when omitted', () => {
      const f = new SheetFunction({ sheet, args: [] });
      expect(f.call()).toBe(2);
    });

    it('returns index of referenced sheet', () => {
      const refTable = new Sheet({});
      refTable.sheetId = 3;
      refTable.initialize({});
      refTable.wire = sheet.wire;

      const mockArg = { evaluate: () => refTable } as any;
      const f = new SheetFunction({ sheet, args: [mockArg] });
      expect(f.call()).toBe(3);
    });

    it('returns 99 if sheet not found in wire', () => {
      const refTable = new Sheet({});
      refTable.sheetId = 99;
      refTable.initialize({});
      refTable.wire = sheet.wire;

      const mockArg = { evaluate: () => refTable } as any;
      const f = new SheetFunction({ sheet, args: [mockArg] });
      expect(f.call()).toBe(99);
    });

    it('returns 88 if current sheet not found in wire', () => {
      const isolatedTable = new Sheet({});
      isolatedTable.sheetId = 88;
      isolatedTable.initialize({});
      isolatedTable.wire = { sheetIdsByName: {} } as any;

      const f = new SheetFunction({ sheet: isolatedTable, args: [] });
      expect(f.call()).toBe(88);
    });
  });

  describe('validation error', () => {
    it('throws on invalid argument type', () => {
      const f = new SheetFunction({ sheet, args: [new ValueEntity('Sheet1')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
