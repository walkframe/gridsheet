import { IserrFunction } from './iserr';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('iserr', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns true for general FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#VALUE!', '') } as any;
      const f = new IserrFunction({ table, args: [errorEntity] });
      expect(f.call()).toBe(true);
    });

    it('returns false for #N/A FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#N/A', '') } as any;
      const f = new IserrFunction({ table, args: [errorEntity] });
      expect(f.call()).toBe(false);
    });

    it('returns false for non-error values', () => {
      const valueEntity = new ValueEntity(123);
      const f = new IserrFunction({ table, args: [valueEntity] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IserrFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
