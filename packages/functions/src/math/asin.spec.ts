import { AsinFunction } from './asin';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('asin', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates asin of 1', () => {
      const f = new AsinFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call()).toBeCloseTo(Math.PI / 2);
    });

    it('calculates asin of 0', () => {
      const f = new AsinFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });

    it('calculates asin of -1', () => {
      const f = new AsinFunction({ sheet, args: [new ValueEntity(-1)] });
      expect(f.call()).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new AsinFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value out of bounds (greater than 1)', () => {
      const f = new AsinFunction({ sheet, args: [new ValueEntity(1.1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value out of bounds (less than -1)', () => {
      const f = new AsinFunction({ sheet, args: [new ValueEntity(-1.1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new AsinFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
