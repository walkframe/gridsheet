import { StdevSFunction } from './stdev_s';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('stdev.s', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 2 },
    A2: { value: 4 },
    A3: { value: 4 },
    A4: { value: 4 },
    A5: { value: 5 },
    A6: { value: 5 },
    A7: { value: 7 },
    A8: { value: 9 },
  });

  describe('normal', () => {
    it('calculates sample standard deviation', () => {
      const f = new StdevSFunction({ sheet, args: [new RangeEntity('A1:A8')] });
      // population variance=4, sample variance=4*8/7≈4.571, stdev≈2.138
      const result = f.call() as number;
      expect(result).toBeCloseTo(2.1381, 3);
    });

    it('accepts individual values', () => {
      const f = new StdevSFunction({ sheet, args: [new ValueEntity(2), new ValueEntity(4)] });
      // sample stdev of [2,4] = sqrt(((2-3)^2+(4-3)^2)/1) = sqrt(2)
      expect(f.call() as number).toBeCloseTo(Math.sqrt(2), 10);
    });
  });

  describe('validation error', () => {
    it('throws on fewer than 2 values', () => {
      const f = new StdevSFunction({ sheet, args: [new ValueEntity(5)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws on zero args', () => {
      const f = new StdevSFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
