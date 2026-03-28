import { ExpFunction } from './exp';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('exp', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates exp of 0', () => {
      const f = new ExpFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });

    it('calculates exp of 1', () => {
      const f = new ExpFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call()).toBeCloseTo(Math.E);
    });

    it('calculates exp of 2', () => {
      const f = new ExpFunction({ sheet, args: [new ValueEntity(2)] });
      expect(f.call()).toBeCloseTo(Math.E * Math.E);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new ExpFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new ExpFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
