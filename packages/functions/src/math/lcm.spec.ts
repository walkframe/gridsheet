import { LcmFunction } from './lcm';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('lcm', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates lcm of two numbers', () => {
      const f = new LcmFunction({ sheet, args: [new ValueEntity(4), new ValueEntity(6)] });
      expect(f.call()).toBe(12);
    });

    it('calculates lcm of multiple numbers', () => {
      const f = new LcmFunction({ sheet, args: [new ValueEntity(2), new ValueEntity(3), new ValueEntity(4)] });
      expect(f.call()).toBe(12);
    });

    it('returns the same value for single number', () => {
      const f = new LcmFunction({ sheet, args: [new ValueEntity(5)] });
      expect(f.call()).toBe(5);
    });

    it('floors arguments before calculation', () => {
      const f = new LcmFunction({ sheet, args: [new ValueEntity(4.9), new ValueEntity(6.1)] });
      expect(f.call()).toBe(12);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new LcmFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new LcmFunction({ sheet, args: [new ValueEntity(4), new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('argument less than 1', () => {
      const f = new LcmFunction({ sheet, args: [new ValueEntity(0), new ValueEntity(4)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
