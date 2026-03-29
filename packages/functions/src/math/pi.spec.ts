import { PiFunction } from './pi';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('pi', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns the value of PI', () => {
      const f = new PiFunction({ sheet, args: [] });
      expect(f.call()).toBe(Math.PI);
    });
  });

  describe('validation error', () => {
    it('has arguments', () => {
      const f = new PiFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
