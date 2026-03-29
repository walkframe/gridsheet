import { SqrtFunction } from './sqrt';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('sqrt', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates the square root of a positive number', () => {
      const f = new SqrtFunction({ sheet, args: [new ValueEntity(9)] });
      expect(f.call()).toBe(3);
    });

    it('calculates the square root of zero', () => {
      const f = new SqrtFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new SqrtFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new SqrtFunction({ sheet, args: [new ValueEntity(9), new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('negative number', () => {
      const f = new SqrtFunction({ sheet, args: [new ValueEntity(-1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new SqrtFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
