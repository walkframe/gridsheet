import { IntFunction } from './int';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('int', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('rounds down positive number', () => {
      const f = new IntFunction({ table, args: [new ValueEntity(8.9)] });
      expect(f.call()).toBe(8);
    });

    it('rounds down negative number', () => {
      const f = new IntFunction({ table, args: [new ValueEntity(-8.9)] });
      expect(f.call()).toBe(-9);
    });

    it('returns the exact integer', () => {
      const f = new IntFunction({ table, args: [new ValueEntity(8)] });
      expect(f.call()).toBe(8);
    });

    it('returns 0 for 0', () => {
      const f = new IntFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IntFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new IntFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
