import { IsnontextFunction } from './isnontext';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('isnontext', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns false for string', () => {
      const f = new IsnontextFunction({ sheet, args: [new ValueEntity('text')] });
      expect(f.call()).toBe(false);
    });

    it('returns true for number', () => {
      const f = new IsnontextFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe(true);
    });

    it('returns true for boolean', () => {
      const f = new IsnontextFunction({ sheet, args: [new ValueEntity(true)] });
      expect(f.call()).toBe(true);
    });

    it('returns true for null/undefined', () => {
      const f = new IsnontextFunction({ sheet, args: [new ValueEntity(null)] });
      expect(f.call()).toBe(true);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsnontextFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
