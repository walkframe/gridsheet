import { ModeSnglFunction } from './mode_sngl';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('mode.sngl', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 1 },
    A2: { value: 2 },
    A3: { value: 2 },
    A4: { value: 3 },
    A5: { value: 3 },
    A6: { value: 3 },
    B1: { value: 1 },
    B2: { value: 2 },
    B3: { value: 3 }, // all unique
  });

  describe('normal', () => {
    it('returns the most frequent value', () => {
      const f = new ModeSnglFunction({ table, args: [new RangeEntity('A1:A6')] });
      // 3 appears 3 times
      expect(f.call()).toBe(3);
    });

    it('returns smallest when multiple modes tie', () => {
      const f = new ModeSnglFunction({ table, args: [new RangeEntity('A1:A5')] });
      // 2 appears 2 times, 3 appears 2 times → smallest = 2
      expect(f.call()).toBe(2);
    });

    it('accepts individual values', () => {
      const f = new ModeSnglFunction({ table, args: [new ValueEntity(5), new ValueEntity(5), new ValueEntity(3)] });
      expect(f.call()).toBe(5);
    });
  });

  describe('validation error', () => {
    it('throws when all values are unique', () => {
      const f = new ModeSnglFunction({ table, args: [new RangeEntity('B1:B3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws on zero args', () => {
      const f = new ModeSnglFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
