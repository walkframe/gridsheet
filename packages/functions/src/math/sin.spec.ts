import { SinFunction } from './sin';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('sin', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates sin of 0', () => {
      const f = new SinFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });

    it('calculates sin of PI/2', () => {
      const f = new SinFunction({ sheet, args: [new ValueEntity(Math.PI / 2)] });
      expect(f.call()).toBeCloseTo(1);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new SinFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new SinFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
