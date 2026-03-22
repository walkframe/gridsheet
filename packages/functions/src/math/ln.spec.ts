import { LnFunction } from './ln';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('ln', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates ln of 1', () => {
      const f = new LnFunction({ sheet, args: [new ValueEntity(1)] });
      expect(f.call()).toBe(0);
    });

    it('calculates ln of e', () => {
      const f = new LnFunction({ sheet, args: [new ValueEntity(Math.E)] });
      expect(f.call()).toBeCloseTo(1);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new LnFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value less than or equal to 0', () => {
      const f = new LnFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new LnFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
