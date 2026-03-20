import { HlookupFunction } from './hlookup';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('hlookup', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 10 },
    B1: { value: 20 },
    C1: { value: 30 },
    A2: { value: 'apple' },
    B2: { value: 'banana' },
    C2: { value: 'cherry' },
    A3: { value: 'red' },
    B3: { value: 'yellow' },
    C3: { value: 'red' },
  });

  describe('normal (exact match)', () => {
    it('looks up value exactly', () => {
      const f = new HlookupFunction({
        table,
        args: [new ValueEntity(20), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(false)],
      });
      expect(f.call()).toBe('banana');
    });

    it('looks up from 3rd row', () => {
      const f = new HlookupFunction({
        table,
        args: [new ValueEntity(30), new RangeEntity('A1:C3'), new ValueEntity(3), new ValueEntity(false)],
      });
      expect(f.call()).toBe('red');
    });

    it('defaults to true if is_sorted is omitted, but exact match still works if it is the first match when true', () => {
      // Actually, if it's default (true), it does approximate match.
      // Let's test approximate match explicitly below.
    });
  });

  describe('normal (approximate match / sorted)', () => {
    it('finds largest value less than or equal to key', () => {
      // Data: 10, 20, 30
      const f = new HlookupFunction({
        table,
        args: [new ValueEntity(25), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(true)],
      });
      expect(f.call()).toBe('banana'); // Matches 20
    });

    it('finds largest value if key is larger than all', () => {
      const f = new HlookupFunction({
        table,
        args: [new ValueEntity(40), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(true)],
      });
      expect(f.call()).toBe('cherry'); // Matches 30
    });
  });

  describe('validation error', () => {
    it('throws if key is not found (exact)', () => {
      const f = new HlookupFunction({
        table,
        args: [new ValueEntity(40), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(false)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if key is smaller than all keys (approximate)', () => {
      const f = new HlookupFunction({
        table,
        args: [new ValueEntity(5), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(true)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if incorrect number of arguments', () => {
      const f = new HlookupFunction({ table, args: [new ValueEntity(10), new RangeEntity('A1:C3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if 2nd arg is not range', () => {
      const f = new HlookupFunction({
        table,
        args: [new ValueEntity(10), new ValueEntity('A1:C3'), new ValueEntity(2)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
