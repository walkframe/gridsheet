import { SignFunction } from './sign';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('sign', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns 1 for positive number', () => {
      const f = new SignFunction({ table, args: [new ValueEntity(5)] });
      expect(f.call()).toBe(1);
    });

    it('returns -1 for negative number', () => {
      const f = new SignFunction({ table, args: [new ValueEntity(-3)] });
      expect(f.call()).toBe(-1);
    });

    it('returns 0 for 0', () => {
      const f = new SignFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new SignFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new SignFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
