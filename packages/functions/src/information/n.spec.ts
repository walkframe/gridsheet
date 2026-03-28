import { NFunction } from './n';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('n', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns number as-is', () => {
      const f = new NFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe(123);
    });

    it('returns 1 for true', () => {
      const f = new NFunction({ sheet, args: [new ValueEntity(true)] });
      expect(f.call()).toBe(1);
    });

    it('returns 0 for false', () => {
      const f = new NFunction({ sheet, args: [new ValueEntity(false)] });
      expect(f.call()).toBe(0);
    });

    it('returns timestamp for date', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const f = new NFunction({ sheet, args: [new ValueEntity(date)] });
      expect(f.call()).toBe(date.getTime());
    });

    it('returns 0 for empty string/null/undefined', () => {
      expect(new NFunction({ sheet, args: [new ValueEntity('')] }).call()).toBe(0);
      expect(new NFunction({ sheet, args: [new ValueEntity(null)] }).call()).toBe(0);
      expect(new NFunction({ sheet, args: [new ValueEntity(undefined)] }).call()).toBe(0);
    });

    it('returns 0 for non-numeric string', () => {
      const f = new NFunction({ sheet, args: [new ValueEntity('text')] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new NFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
