import { RankEqFunction } from './rank_eq';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('rank.eq', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 10 },
    A2: { value: 30 },
    A3: { value: 20 },
    A4: { value: 30 },
  });

  describe('normal', () => {
    it('ranks descending by default', () => {
      const f = new RankEqFunction({
        sheet,
        args: [new ValueEntity(30), new RangeEntity('A1:A4'), new ValueEntity(false)],
      });
      // sorted desc: 30,30,20,10 → rank of 30 = 1
      expect(f.call()).toBe(1);
    });

    it('ranks ascending when flag is true', () => {
      const f = new RankEqFunction({
        sheet,
        args: [new ValueEntity(10), new RangeEntity('A1:A4'), new ValueEntity(true)],
      });
      // sorted asc: 10,20,30,30 → rank of 10 = 1
      expect(f.call()).toBe(1);
    });

    it('returns top rank when ties exist (descending)', () => {
      const f = new RankEqFunction({ sheet, args: [new ValueEntity(20), new RangeEntity('A1:A4')] });
      // desc: 30,30,20,10 → rank of 20 = 3
      expect(f.call()).toBe(3);
    });
  });

  describe('validation error', () => {
    it('throws when value not in range', () => {
      const f = new RankEqFunction({ sheet, args: [new ValueEntity(99), new RangeEntity('A1:A4')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
