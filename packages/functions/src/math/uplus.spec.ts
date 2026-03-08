import { UplusFunction } from './uplus';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('uplus', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns positive number as-is', () => {
      const f = new UplusFunction({ table, args: [new ValueEntity(4)] });
      expect(f.call()).toBe(4);
    });

    it('returns negative number as-is', () => {
      const f = new UplusFunction({ table, args: [new ValueEntity(-4)] });
      expect(f.call()).toBe(-4);
    });

    it('returns zero as-is', () => {
      const f = new UplusFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new UplusFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new UplusFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
