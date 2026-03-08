import { RoundFunction } from './round';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('round', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('rounds to 0 decimal places by default', () => {
      const f = new RoundFunction({ table, args: [new ValueEntity(99.44)] });
      expect(f.call()).toBe(99);
    });

    it('rounds to specified decimal places', () => {
      const f = new RoundFunction({ table, args: [new ValueEntity(99.44), new ValueEntity(1)] });
      expect(f.call()).toBe(99.4);
    });

    it('rounds up if next digit is 5 or more', () => {
      const f = new RoundFunction({ table, args: [new ValueEntity(99.45), new ValueEntity(1)] });
      expect(f.call()).toBe(99.5);
    });

    it('rounds with negative precision', () => {
      const f = new RoundFunction({ table, args: [new ValueEntity(1234.56), new ValueEntity(-2)] });
      expect(f.call()).toBe(1200);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new RoundFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new RoundFunction({ table, args: [new ValueEntity(1), new ValueEntity(2), new ValueEntity(3)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
