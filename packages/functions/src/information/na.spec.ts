import { NaFunction } from './na';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('na', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('throws #N/A FormulaError', () => {
      const f = new NaFunction({ table, args: [] });
      try {
        f.call();
        fail('Expected to throw FormulaError');
      } catch (e: any) {
        expect(e).toBeInstanceOf(FormulaError);
        expect(e.code).toBe('#N/A');
      }
    });
  });

  describe('validation error', () => {
    it('too many arguments', () => {
      const f = new NaFunction({ table, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
