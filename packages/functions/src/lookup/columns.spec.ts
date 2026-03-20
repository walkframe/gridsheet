import { ColumnsFunction } from './columns';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('columns', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 1 },
    B1: { value: 2 },
    C1: { value: 3 },
    D1: { value: 4 },
    A2: { value: 5 },
    B2: { value: 6 },
    C2: { value: 7 },
    D2: { value: 8 },
  });

  describe('normal', () => {
    it('returns number of columns in a range', () => {
      const f = new ColumnsFunction({ table, args: [new RangeEntity('A1:D5')] });
      expect(f.call()).toBe(4); // A, B, C, D
    });

    it('returns 1 for a single cell', () => {
      const f = new ColumnsFunction({ table, args: [new RangeEntity('C3')] });
      expect(f.call()).toBe(1);
    });

    it('returns columns for whole columns reference', () => {
      const f = new ColumnsFunction({ table, args: [new RangeEntity('A:C')] });
      expect(f.call()).toBe(3);
    });
  });

  describe('validation error', () => {
    it('throws when missing argument', () => {
      const f = new ColumnsFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws when argument is not a range', () => {
      const f = new ColumnsFunction({ table, args: [new ValueEntity('A1:D5')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
