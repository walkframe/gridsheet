import { IsoddFunction } from './isodd';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('isodd', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for an odd number', () => {
      const f = new IsoddFunction({ sheet, args: [new ValueEntity(3)] });
      expect(f.call()).toBe(true);
    });

    it('returns false for an even number', () => {
      const f = new IsoddFunction({ sheet, args: [new ValueEntity(4)] });
      expect(f.call()).toBe(false);
    });

    it('returns true for negative odd number', () => {
      const f = new IsoddFunction({ sheet, args: [new ValueEntity(-3)] });
      expect(f.call()).toBe(true);
    });

    it('floors the number before checking', () => {
      const f = new IsoddFunction({ sheet, args: [new ValueEntity(3.5)] }); // Math.floor(3.5) -> 3
      expect(f.call()).toBe(true);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsoddFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new IsoddFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
