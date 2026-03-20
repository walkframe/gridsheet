import { QuartileIncFunction } from './quartile_inc';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('quartile.inc', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 1 },
    A2: { value: 2 },
    A3: { value: 3 },
    A4: { value: 4 },
    A5: { value: 5 },
  });

  describe('normal', () => {
    it('returns min for quartile 0', () => {
      const f = new QuartileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });

    it('returns Q1 for quartile 1', () => {
      const f = new QuartileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(1)] });
      // k=0.25, pos=1.0, nums[1]=2
      expect(f.call()).toBe(2);
    });

    it('returns median for quartile 2', () => {
      const f = new QuartileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(2)] });
      expect(f.call()).toBe(3);
    });

    it('returns Q3 for quartile 3', () => {
      const f = new QuartileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(3)] });
      // k=0.75, pos=3.0, nums[3]=4
      expect(f.call()).toBe(4);
    });

    it('returns max for quartile 4', () => {
      const f = new QuartileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(4)] });
      expect(f.call()).toBe(5);
    });
  });

  describe('validation error', () => {
    it('throws for quartile < 0', () => {
      const f = new QuartileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(-1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws for quartile > 4', () => {
      const f = new QuartileIncFunction({ table, args: [new RangeEntity('A1:A5'), new ValueEntity(5)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
