import { RounddownFunction } from './rounddown';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('rounddown', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('rounds down to 0 decimal places by default', () => {
      const f = new RounddownFunction({ table, args: [new ValueEntity(99.44)] });
      expect(f.call()).toBe(99);
    });

    it('rounds down to specified decimal places', () => {
      const f = new RounddownFunction({ table, args: [new ValueEntity(99.44), new ValueEntity(1)] });
      expect(f.call()).toBe(99.4);
    });

    it('rounds down even if next digit is 5 or more', () => {
      const f = new RounddownFunction({ table, args: [new ValueEntity(99.99), new ValueEntity(1)] });
      expect(f.call()).toBe(99.9);
    });

    it('rounds down negative numbers', () => {
      const f = new RounddownFunction({ table, args: [new ValueEntity(-99.44), new ValueEntity(1)] });
      expect(f.call()).toBe(-99.5); // Math.floor(-99.44 * 10) / 10 = -99.5
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new RounddownFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
