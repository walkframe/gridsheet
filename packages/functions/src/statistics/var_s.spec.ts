import { VarSFunction } from './var_s';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('var.s', () => {
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
    it('calculates sample variance', () => {
      const f = new VarSFunction({ sheet, args: [new RangeEntity('A1:A8')] });
      // mean=5, sum of sq dev=32, sample var=32/7≈4.571
      const result = f.call() as number;
      expect(result).toBeCloseTo(32 / 7, 10);
    });

    it('accepts individual values', () => {
      const f = new VarSFunction({ sheet, args: [new ValueEntity(2), new ValueEntity(4)] });
      // sample var of [2,4] = 2
      expect(f.call() as number).toBeCloseTo(2, 10);
    });
  });

  describe('validation error', () => {
    it('throws on fewer than 2 values', () => {
      const f = new VarSFunction({ sheet, args: [new ValueEntity(5)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws on zero args', () => {
      const f = new VarSFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
