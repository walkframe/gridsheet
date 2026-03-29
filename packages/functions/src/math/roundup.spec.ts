import { RoundupFunction } from './roundup';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('roundup', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('rounds up to 0 decimal places by default', () => {
      const f = new RoundupFunction({ sheet, args: [new ValueEntity(99.44)] });
      expect(f.call()).toBe(100);
    });

    it('rounds up to specified decimal places', () => {
      const f = new RoundupFunction({ sheet, args: [new ValueEntity(99.44), new ValueEntity(1)] });
      expect(f.call()).toBe(99.5);
    });

    it('rounds up negative numbers', () => {
      const f = new RoundupFunction({ sheet, args: [new ValueEntity(-99.44), new ValueEntity(1)] });
      expect(f.call()).toBe(-99.4); // Math.ceil(-99.44 * 10) / 10 = -99.4
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new RoundupFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
