import { IsblankFunction } from './isblank';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('isblank', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for null', () => {
      const f = new IsblankFunction({ sheet, args: [new ValueEntity(null)] });
      expect(f.call()).toBe(true);
    });

    it('returns true for undefined', () => {
      const f = new IsblankFunction({ sheet, args: [new ValueEntity(undefined)] });
      expect(f.call()).toBe(true);
    });

    it('returns true for empty string', () => {
      const f = new IsblankFunction({ sheet, args: [new ValueEntity('')] });
      expect(f.call()).toBe(true);
    });

    it('returns false for 0', () => {
      const f = new IsblankFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(false);
    });

    it('returns false for false', () => {
      const f = new IsblankFunction({ sheet, args: [new ValueEntity(false)] });
      expect(f.call()).toBe(false);
    });

    it('returns false for non-empty string', () => {
      const f = new IsblankFunction({ sheet, args: [new ValueEntity(' ')] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsblankFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new IsblankFunction({ sheet, args: [new ValueEntity(''), new ValueEntity('')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
