import { IslogicalFunction } from './islogical';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('islogical', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for boolean true', () => {
      const f = new IslogicalFunction({ sheet, args: [new ValueEntity(true)] });
      expect(f.call()).toBe(true);
    });

    it('returns true for boolean false', () => {
      const f = new IslogicalFunction({ sheet, args: [new ValueEntity(false)] });
      expect(f.call()).toBe(true);
    });

    it('returns false for numbers', () => {
      const f = new IslogicalFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call()).toBe(false);
    });

    it('returns false for strings', () => {
      const f = new IslogicalFunction({ sheet, args: [new ValueEntity('true')] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('throws error if missing argument', () => {
      const f = new IslogicalFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
