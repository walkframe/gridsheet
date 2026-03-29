import { IsevenFunction } from './iseven';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('iseven', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for an even number', () => {
      const f = new IsevenFunction({ sheet, args: [new ValueEntity(4)] });
      expect(f.call()).toBe(true);
    });

    it('returns false for an odd number', () => {
      const f = new IsevenFunction({ sheet, args: [new ValueEntity(3)] });
      expect(f.call()).toBe(false);
    });

    it('returns true for negative even number', () => {
      const f = new IsevenFunction({ sheet, args: [new ValueEntity(-2)] });
      expect(f.call()).toBe(true);
    });

    it('floors the number before checking', () => {
      const f = new IsevenFunction({ sheet, args: [new ValueEntity(2.5)] }); // Math.floor(2.5) -> 2
      expect(f.call()).toBe(true);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsevenFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new IsevenFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
