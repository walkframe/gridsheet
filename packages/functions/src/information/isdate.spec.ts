import { IsdateFunction } from './isdate';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('isdate', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for Date object', () => {
      const f = new IsdateFunction({ sheet, args: [new ValueEntity(new Date())] });
      expect(f.call()).toBe(true);
    });

    it('returns false for invalid Date object', () => {
      const f = new IsdateFunction({ sheet, args: [new ValueEntity(new Date('invalid'))] });
      expect(f.call()).toBe(false);
    });

    it('returns false for string resembling date', () => {
      const f = new IsdateFunction({ sheet, args: [new ValueEntity('2023-01-01')] });
      expect(f.call()).toBe(false);
    });

    it('returns false for numbers', () => {
      const f = new IsdateFunction({ sheet, args: [new ValueEntity(44197)] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsdateFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
