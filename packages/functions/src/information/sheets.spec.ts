import { SheetsFunction } from './sheets';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('sheets', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns 1 for single standalone table', () => {
      const f = new SheetsFunction({ table, args: [] });
      expect(f.call()).toBe(1);
    });

    it('returns count from wire when multiple sheets exist', () => {
      const t = new Table({});
      t.initialize({});
      if (t.wire) {
        t.wire.sheetIdsByName = { Sheet1: 1, Sheet2: 2 };
      }
      const f = new SheetsFunction({ table: t, args: [] });
      expect(f.call()).toBe(2);
    });
  });

  describe('validation error', () => {
    it('too many arguments', () => {
      const f = new SheetsFunction({ table, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
