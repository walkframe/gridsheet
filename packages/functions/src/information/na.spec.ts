import { NaFunction } from './na';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('na', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('throws #N/A FormulaError', () => {
      const f = new NaFunction({ sheet, args: [] });
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
      const f = new NaFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
