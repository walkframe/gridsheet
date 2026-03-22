import { IserrorFunction } from './iserror';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('iserror', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for general FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#VALUE!', '') } as any;
      const f = new IserrorFunction({ sheet, args: [errorEntity] });
      expect(f.call()).toBe(true);
    });

    it('returns true for #N/A FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#N/A', '') } as any;
      const f = new IserrorFunction({ sheet, args: [errorEntity] });
      expect(f.call()).toBe(true);
    });

    it('returns false for non-error values', () => {
      const valueEntity = new ValueEntity(123);
      const f = new IserrorFunction({ sheet, args: [valueEntity] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IserrorFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
