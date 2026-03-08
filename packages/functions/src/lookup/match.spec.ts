import { MatchFunction } from './match';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('match', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 10 },
    A2: { value: 20 },
    A3: { value: 30 },
    A4: { value: 40 },
    B1: { value: 40 },
    C1: { value: 30 },
    D1: { value: 20 },
    E1: { value: 10 },
  });

  describe('normal', () => {
    it('finds exact match (type 0)', () => {
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(30), new RangeEntity('A1:A4'), new ValueEntity(0)],
      });
      expect(f.call()).toBe(3); // 1-based index
    });

    it('finds less than or equal match (type 1)', () => {
      // Data in ascending order: 10, 20, 30, 40
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(25), new RangeEntity('A1:A4'), new ValueEntity(1)],
      });
      expect(f.call()).toBe(2); // matches 20
    });

    it('defaults to type 1', () => {
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(35), new RangeEntity('A1:A4')],
      });
      expect(f.call()).toBe(3); // matches 30
    });

    it('finds greater than or equal match (type -1) in row', () => {
      // Data in descending order: 40, 30, 20, 10
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(25), new RangeEntity('B1:E1'), new ValueEntity(-1)],
      });
      expect(f.call()).toBe(2); // matches 30 (2nd column in B:E) (B1=40, C1=30, D1=20...)
    });
  });

  describe('validation error', () => {
    it('throws if number of arguments is incorrect', () => {
      const f = new MatchFunction({ table, args: [new ValueEntity(10)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if range is not 1D', () => {
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(30), new RangeEntity('A1:B2'), new ValueEntity(0)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if match type is invalid', () => {
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(30), new RangeEntity('A1:A4'), new ValueEntity(2)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if value not found in exact match', () => {
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(50), new RangeEntity('A1:A4'), new ValueEntity(0)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if value not found in approximate match', () => {
      const f = new MatchFunction({
        table,
        args: [new ValueEntity(5), new RangeEntity('A1:A4'), new ValueEntity(1)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
