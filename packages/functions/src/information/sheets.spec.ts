import { SheetsFunction } from './sheets';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('sheets', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns 1 for single standalone sheet', () => {
      const f = new SheetsFunction({ sheet, args: [] });
      expect(f.call()).toBe(1);
    });

    it('returns count from wire when multiple sheets exist', () => {
      const t = new Sheet({});
      t.initialize({});
      t.registry.sheetIdsByName = { Sheet1: 1, Sheet2: 2 };
      const f = new SheetsFunction({ sheet: t, args: [] });
      expect(f.call()).toBe(2);
    });
  });

  describe('validation error', () => {
    it('too many arguments', () => {
      const f = new SheetsFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
