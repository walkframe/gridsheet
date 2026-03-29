import { IstextFunction } from './istext';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('istext', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for string', () => {
      const f = new IstextFunction({ sheet, args: [new ValueEntity('text')] });
      expect(f.call()).toBe(true);
    });

    it('returns true for empty string', () => {
      const f = new IstextFunction({ sheet, args: [new ValueEntity('')] });
      expect(f.call()).toBe(true);
    });

    it('returns false for number', () => {
      const f = new IstextFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe(false);
    });

    it('returns false for boolean', () => {
      const f = new IstextFunction({ sheet, args: [new ValueEntity(true)] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IstextFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
