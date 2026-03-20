import { StdevPFunction } from './stdev_p';
import { StdevSFunction } from './stdev_s';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('stdev.p', () => {
  const table = new Table({});
  table.initialize({
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
    it('calculates population standard deviation (sqrt of VAR.P)', () => {
      const f = new StdevPFunction({ table, args: [new RangeEntity('A1:A8')] });
      // mean=5, population variance=4, stdev=2
      expect(f.call()).toBe(2);
    });

    it('returns 0 for a single value', () => {
      const f = new StdevPFunction({ table, args: [new ValueEntity(7)] });
      expect(f.call()).toBe(0);
    });

    it('accepts individual values', () => {
      const f = new StdevPFunction({ table, args: [new ValueEntity(2), new ValueEntity(8)] });
      // mean=5, var=((9+9)/2)=9, stdev=3
      expect(f.call()).toBe(3);
    });

    it('is smaller than STDEV.S for same data', () => {
      const fp = new StdevPFunction({ table, args: [new RangeEntity('A1:A8')] });
      const fs = new StdevSFunction({ table, args: [new RangeEntity('A1:A8')] });
      expect(fp.call() as number).toBeLessThan(fs.call() as number);
    });
  });

  describe('validation error', () => {
    it('throws on zero args', () => {
      const f = new StdevPFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
