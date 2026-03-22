import { IsnaFunction } from './isna';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('isna', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns true for #N/A FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#N/A', '') } as any;
      const f = new IsnaFunction({ sheet, args: [errorEntity] });
      expect(f.call()).toBe(true);
    });

    it('returns false for other FormulaError', () => {
      const errorEntity = { evaluate: () => new FormulaError('#VALUE!', '') } as any;
      const f = new IsnaFunction({ sheet, args: [errorEntity] });
      expect(f.call()).toBe(false);
    });

    it('returns false for non-error values', () => {
      const valueEntity = new ValueEntity(123);
      const f = new IsnaFunction({ sheet, args: [valueEntity] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsnaFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
