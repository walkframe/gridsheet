import { NaFunction } from './na';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('na', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns #N/A FormulaError', () => {
      const f = new NaFunction({ table, args: [] });
      const result = f.call();
      expect(result).toBeInstanceOf(FormulaError);
      expect((result as FormulaError).code).toBe('#N/A');
    });
  });

  describe('validation error', () => {
    it('too many arguments', () => {
      const f = new NaFunction({ table, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
