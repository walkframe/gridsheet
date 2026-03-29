import { AcosFunction } from './acos';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('acos', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates acos of 1', () => {
      const f = new AcosFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call()).toBe(0);
    });

    it('calculates acos of 0', () => {
      const f = new AcosFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBeCloseTo(Math.PI / 2);
    });

    it('calculates acos of -1', () => {
      const f = new AcosFunction({ sheet, args: [new ValueEntity(-1)] });
      expect(f.call()).toBeCloseTo(Math.PI);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new AcosFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value out of bounds (greater than 1)', () => {
      const f = new AcosFunction({ sheet, args: [new ValueEntity(1.1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value out of bounds (less than -1)', () => {
      const f = new AcosFunction({ sheet, args: [new ValueEntity(-1.1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new AcosFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
