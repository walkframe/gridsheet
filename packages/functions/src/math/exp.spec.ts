import { ExpFunction } from './exp';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('exp', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('calculates exp of 0', () => {
      const f = new ExpFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });

    it('calculates exp of 1', () => {
      const f = new ExpFunction({ table, args: [new ValueEntity(1)] });
      expect(f.call()).toBeCloseTo(Math.E);
    });

    it('calculates exp of 2', () => {
      const f = new ExpFunction({ table, args: [new ValueEntity(2)] });
      expect(f.call()).toBeCloseTo(Math.E * Math.E);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new ExpFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new ExpFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
