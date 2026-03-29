import { RowsFunction } from './rows';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('rows', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 1 },
    B1: { value: 2 },
    A2: { value: 3 },
    B2: { value: 4 },
    A3: { value: 5 },
    B3: { value: 6 },
  });

  describe('normal', () => {
    it('returns number of rows in a range', () => {
      const f = new RowsFunction({ sheet, args: [new RangeEntity('A1:B3')] });
      expect(f.call()).toBe(3);
    });

    it('returns 1 for a single cell', () => {
      const f = new RowsFunction({ sheet, args: [new RangeEntity('A1')] });
      expect(f.call()).toBe(1);
    });

    it('returns rows for whole rows reference', () => {
      const f = new RowsFunction({ sheet, args: [new RangeEntity('2:4')] });
      expect(f.call()).toBe(3);
    });
  });

  describe('validation error', () => {
    it('throws when missing argument', () => {
      const f = new RowsFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws when argument is not a range', () => {
      const f = new RowsFunction({ sheet, args: [new ValueEntity('A1:B3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
