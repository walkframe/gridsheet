import { SheetFunction } from './sheet';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('sheet', () => {
  const table = new Table({});
  table.sheetId = 2;
  table.initialize({});
  table.wire = {
    sheetIdsByName: {
      Sheet1: 1,
      Sheet2: 2,
      Sheet3: 3,
    },
  } as any;

  describe('normal', () => {
    it('returns current sheet index when omitted', () => {
      const f = new SheetFunction({ table, args: [] });
      expect(f.call()).toBe(2);
    });

    it('returns index of referenced sheet', () => {
      const refTable = new Table({});
      refTable.sheetId = 3;
      refTable.initialize({});
      refTable.wire = table.wire;

      const mockArg = { evaluate: () => refTable } as any;
      const f = new SheetFunction({ table, args: [mockArg] });
      expect(f.call()).toBe(3);
    });

    it('returns 1 if sheet not found in wire', () => {
      const refTable = new Table({});
      refTable.sheetId = 99;
      refTable.initialize({});
      refTable.wire = table.wire;

      const mockArg = { evaluate: () => refTable } as any;
      const f = new SheetFunction({ table, args: [mockArg] });
      expect(f.call()).toBe(1);
    });

    it('returns 1 if current sheet not found in wire', () => {
      const isolatedTable = new Table({});
      isolatedTable.sheetId = 88;
      isolatedTable.initialize({});
      isolatedTable.wire = { sheetIdsByName: {} } as any;

      const f = new SheetFunction({ table: isolatedTable, args: [] });
      expect(f.call()).toBe(1);
    });
  });

  describe('validation error', () => {
    it('throws on invalid argument type', () => {
      const f = new SheetFunction({ table, args: [new ValueEntity('Sheet1')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
