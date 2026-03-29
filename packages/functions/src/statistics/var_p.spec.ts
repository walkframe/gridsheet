import { VarPFunction } from './var_p';
import { VarSFunction } from './var_s';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('var.p', () => {
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
    it('calculates population variance (divides by n)', () => {
      const f = new VarPFunction({ sheet, args: [new RangeEntity('A1:A8')] });
      // mean=5, sum of sq dev=32, population var=32/8=4
      expect(f.call()).toBe(4);
    });

    it('returns 0 for a single value', () => {
      const f = new VarPFunction({ sheet, args: [new ValueEntity(7)] });
      expect(f.call()).toBe(0);
    });

    it('accepts individual values', () => {
      const f = new VarPFunction({ sheet, args: [new ValueEntity(2), new ValueEntity(8)] });
      // mean=5, var=((2-5)^2+(8-5)^2)/2=9
      expect(f.call()).toBe(9);
    });

    it('differs from VAR.S for same data', () => {
      const fp = new VarPFunction({ sheet, args: [new RangeEntity('A1:A8')] });
      const fs = new VarSFunction({ sheet, args: [new RangeEntity('A1:A8')] });
      // VAR.P = 4, VAR.S = 32/7 ≈ 4.571
      expect(fp.call() as number).toBeLessThan(fs.call() as number);
    });
  });

  describe('validation error', () => {
    it('throws on zero args', () => {
      const f = new VarPFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
