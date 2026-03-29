import { IserrFunction } from './iserr';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('iserr', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for general FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#VALUE!', '') } as any;
      const f = new IserrFunction({ sheet, args: [errorEntity] });
      expect(f.call()).toBe(true);
    });

    it('returns false for #N/A FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#N/A', '') } as any;
      const f = new IserrFunction({ sheet, args: [errorEntity] });
      expect(f.call()).toBe(false);
    });

    it('returns false for non-error values', () => {
      const valueEntity = new ValueEntity(123);
      const f = new IserrFunction({ sheet, args: [valueEntity] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IserrFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
