import { RandFunction } from './rand';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('rand', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns a number between 0 and 1', () => {
      const f = new RandFunction({ sheet, args: [] });
      const val = f.call();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });
  });

  describe('validation error', () => {
    it('has arguments', () => {
      const f = new RandFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
