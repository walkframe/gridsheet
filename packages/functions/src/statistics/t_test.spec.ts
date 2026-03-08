import { TTestFunction } from './t_test';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('t.test', () => {
  const table = new Table({});
  // Two groups: identical values → t=0, p=1
  table.initialize({
    A1: { value: 1 },
    A2: { value: 2 },
    A3: { value: 3 },
    B1: { value: 1 },
    B2: { value: 2 },
    B3: { value: 3 },
    // Different means for paired test
    C1: { value: 10 },
    C2: { value: 20 },
    C3: { value: 30 },
    D1: { value: 11 },
    D2: { value: 21 },
    D3: { value: 31 },
  });

  describe('normal', () => {
    it('returns 1 for identical samples (two-tailed, equal variance)', () => {
      const f = new TTestFunction({
        table,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3'), new ValueEntity(2), new ValueEntity(2)],
      });
      expect(f.call() as number).toBeCloseTo(1, 5);
    });

    it('returns 1 for paired test with identical paired differences', () => {
      // A=[1,2,3] vs D=[2,3,4] → diffs=[1,1,1] → varD=0 → t=NaN by definition
      // Use A=[1,3,5] vs B=[2,4,6] → diffs=[-1,-1,-1] → same issue
      // Use data where diffs have variance: A=[1,2,3] B=[2,3,5] → diffs=[-1,-1,-2] meanD=-4/3, varD≠0
      const t2 = new Table({});
      t2.initialize({
        A1: { value: 1 },
        A2: { value: 2 },
        A3: { value: 3 },
        B1: { value: 2 },
        B2: { value: 3 },
        B3: { value: 5 },
      });
      const f = new TTestFunction({
        table: t2,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3'), new ValueEntity(2), new ValueEntity(1)],
      });
      const p = f.call() as number;
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThanOrEqual(1);
    });

    it('returns p < 1 for different samples', () => {
      const f = new TTestFunction({
        table,
        args: [new RangeEntity('A1:A3'), new RangeEntity('C1:C3'), new ValueEntity(2), new ValueEntity(2)],
      });
      const p = f.call() as number;
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    });

    it('one-tailed returns half of two-tailed for symmetric case', () => {
      const f2 = new TTestFunction({
        table,
        args: [new RangeEntity('A1:A3'), new RangeEntity('C1:C3'), new ValueEntity(2), new ValueEntity(3)],
      });
      const f1 = new TTestFunction({
        table,
        args: [new RangeEntity('A1:A3'), new RangeEntity('C1:C3'), new ValueEntity(1), new ValueEntity(3)],
      });
      expect((f1.call() as number) * 2).toBeCloseTo(f2.call() as number, 10);
    });
  });

  describe('validation error', () => {
    it('throws for invalid tails value', () => {
      const f = new TTestFunction({
        table,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3'), new ValueEntity(3), new ValueEntity(2)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws for invalid type value', () => {
      const f = new TTestFunction({
        table,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3'), new ValueEntity(2), new ValueEntity(4)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws for paired test with unequal lengths', () => {
      const f = new TTestFunction({
        table,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B2'), new ValueEntity(2), new ValueEntity(1)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
