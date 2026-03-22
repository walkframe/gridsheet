import { Log10Function } from './log10';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('log10', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates log10 of 1', () => {
      const f = new Log10Function({ sheet, args: [new ValueEntity(1)] });
      expect(f.call()).toBe(0);
    });

    it('calculates log10 of 100', () => {
      const f = new Log10Function({ sheet, args: [new ValueEntity(100)] });
      expect(f.call()).toBeCloseTo(2);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new Log10Function({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value less than or equal to 0', () => {
      const f = new Log10Function({ sheet, args: [new ValueEntity(0)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new Log10Function({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
