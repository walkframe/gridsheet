import { CosFunction } from './cos';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('cos', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates cos of 0', () => {
      const f = new CosFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });

    it('calculates cos of PI', () => {
      const f = new CosFunction({ sheet, args: [new ValueEntity(Math.PI)] });
      expect(f.call()).toBeCloseTo(-1);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new CosFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new CosFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
