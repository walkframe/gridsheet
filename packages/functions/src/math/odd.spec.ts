import { OddFunction } from './odd';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('odd', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('rounds up to the nearest odd integer (positive)', () => {
      const f = new OddFunction({ table, args: [new ValueEntity(1.5)] });
      expect(f.call()).toBe(3);
    });

    it('rounds up to the nearest odd integer (negative)', () => {
      const f = new OddFunction({ table, args: [new ValueEntity(-1.5)] });
      expect(f.call()).toBe(-3);
    });

    it('returns the same odd integer', () => {
      const f = new OddFunction({ table, args: [new ValueEntity(3)] });
      expect(f.call()).toBe(3);
    });

    it('returns 1 for 0', () => {
      const f = new OddFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new OddFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new OddFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
