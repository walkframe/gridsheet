import { OddFunction } from './odd';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('odd', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('rounds up to the nearest odd integer (positive)', () => {
      const f = new OddFunction({ sheet, args: [new ValueEntity(1.5)] });
      expect(f.call()).toBe(3);
    });

    it('rounds up to the nearest odd integer (negative)', () => {
      const f = new OddFunction({ sheet, args: [new ValueEntity(-1.5)] });
      expect(f.call()).toBe(-3);
    });

    it('returns the same odd integer', () => {
      const f = new OddFunction({ sheet, args: [new ValueEntity(3)] });
      expect(f.call()).toBe(3);
    });

    it('returns 1 for 0', () => {
      const f = new OddFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new OddFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new OddFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
