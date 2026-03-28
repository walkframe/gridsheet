import { EvenFunction } from './even';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('even', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('rounds up to the nearest even integer (positive)', () => {
      const f = new EvenFunction({ sheet, args: [new ValueEntity(1.5)] });
      expect(f.call()).toBe(2);
    });

    it('rounds up to the nearest even integer (negative)', () => {
      const f = new EvenFunction({ sheet, args: [new ValueEntity(-1.5)] });
      expect(f.call()).toBe(-2);
    });

    it('returns the same even integer', () => {
      const f = new EvenFunction({ sheet, args: [new ValueEntity(2)] });
      expect(f.call()).toBe(2);
    });

    it('returns 0 for 0', () => {
      const f = new EvenFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new EvenFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new EvenFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
