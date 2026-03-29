import { IsrefFunction } from './isref';
import { Sheet, FormulaError, ValueEntity, RefEntity, RangeEntity } from '@gridsheet/core';

describe('isref', () => {
  const sheet = new Sheet({});
  sheet.initialize({ A1: { value: 1 } });

  describe('normal', () => {
    it('returns true for Sheet range (using RangeEntity)', () => {
      const ref = new RangeEntity('A1');
      const f = new IsrefFunction({ sheet, args: [ref] });
      expect(f.call()).toBe(true);
    });

    it('returns false for strings', () => {
      const f = new IsrefFunction({ sheet, args: [new ValueEntity('A1')] });
      expect(f.call()).toBe(false);
    });

    it('returns false for numbers', () => {
      const f = new IsrefFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsrefFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
