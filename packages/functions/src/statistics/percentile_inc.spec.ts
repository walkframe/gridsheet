import { PercentileIncFunction } from './percentile_inc';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('percentile.inc', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 1 },
    A2: { value: 2 },
    A3: { value: 3 },
    A4: { value: 4 },
    A5: { value: 5 },
  });

  describe('normal', () => {
    it('returns minimum for k=0', () => {
      const f = new PercentileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });

    it('returns maximum for k=1', () => {
      const f = new PercentileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(1)] });
      expect(f.call()).toBe(5);
    });

    it('returns median for k=0.5', () => {
      const f = new PercentileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(0.5)] });
      expect(f.call()).toBe(3);
    });

    it('interpolates for fractional positions', () => {
      const f = new PercentileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(0.25)] });
      // pos = 0.25 * 4 = 1, nums[1]=2
      expect(f.call()).toBe(2);
    });
  });

  describe('validation error', () => {
    it('throws for k < 0', () => {
      const f = new PercentileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(-0.1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws for k > 1', () => {
      const f = new PercentileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(1.1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
