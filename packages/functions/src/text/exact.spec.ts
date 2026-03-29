import { ExactFunction } from './exact';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('exact', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for exact match', () => {
      const f = new ExactFunction({ sheet, args: [new ValueEntity('apple'), new ValueEntity('apple')] });
      expect(f.call()).toBe(true);
    });

    it('returns false for case mismatch', () => {
      const f = new ExactFunction({ sheet, args: [new ValueEntity('apple'), new ValueEntity('Apple')] });
      expect(f.call()).toBe(false);
    });

    it('returns false for different strings', () => {
      const f = new ExactFunction({ sheet, args: [new ValueEntity('apple'), new ValueEntity('banana')] });
      expect(f.call()).toBe(false);
    });

    it('converts numbers to string before comparing', () => {
      const f = new ExactFunction({ sheet, args: [new ValueEntity(123), new ValueEntity('123')] });
      expect(f.call()).toBe(true);
    });
  });

  describe('validation error', () => {
    it('missing arguments', () => {
      const f = new ExactFunction({ sheet, args: [new ValueEntity('apple')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new ExactFunction({ sheet, args: [new ValueEntity('a'), new ValueEntity('a'), new ValueEntity('a')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
