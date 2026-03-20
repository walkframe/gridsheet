import { LogFunction } from './log';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('log', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates log base 2 of 128', () => {
      const f = new LogFunction({ sheet, args: [new ValueEntity(128), new ValueEntity(2)] });
      expect(f.call()).toBe(7);
    });

    it('calculates log base 10 of 100', () => {
      const f = new LogFunction({ sheet, args: [new ValueEntity(100), new ValueEntity(10)] });
      expect(f.call()).toBeCloseTo(2);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new LogFunction({ sheet, args: [new ValueEntity(128)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value less than or equal to 0', () => {
      const f = new LogFunction({ sheet, args: [new ValueEntity(0), new ValueEntity(2)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('base less than or equal to 1', () => {
      const f = new LogFunction({ sheet, args: [new ValueEntity(128), new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
