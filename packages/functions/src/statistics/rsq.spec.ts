import { RsqFunction } from './rsq';
import { Table, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('rsq', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 1 },
    A2: { value: 2 },
    A3: { value: 3 },
    B1: { value: 2 },
    B2: { value: 4 },
    B3: { value: 6 }, // perfect positive correlation
    C1: { value: 3 },
    C2: { value: 2 },
    C3: { value: 1 }, // perfect negative correlation
    D1: { value: 1 },
    D2: { value: 3 },
    D3: { value: 2 }, // partial correlation
  });

  describe('normal', () => {
    it('returns 1 for perfect positive correlation', () => {
      const f = new RsqFunction({ table, args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3')] });
      expect(f.call() as number).toBeCloseTo(1, 10);
    });

    it('returns 1 for perfect negative correlation', () => {
      const f = new RsqFunction({ table, args: [new RangeEntity('A1:A3'), new RangeEntity('C1:C3')] });
      expect(f.call() as number).toBeCloseTo(1, 10);
    });

    it('returns R² for partial correlation', () => {
      // A=[1,2,3], D=[1,3,2] → r=0.5, R²=0.25
      const f = new RsqFunction({ table, args: [new RangeEntity('A1:A3'), new RangeEntity('D1:D3')] });
      expect(f.call() as number).toBeCloseTo(0.25, 10);
    });
  });

  describe('validation error', () => {
    it('throws when ranges have different lengths', () => {
      const f = new RsqFunction({ table, args: [new RangeEntity('A1:A2'), new RangeEntity('B1:B3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws when a range has constant values (stdev=0)', () => {
      const table2 = new Table({});
      table2.initialize({ A1: { value: 5 }, A2: { value: 5 }, B1: { value: 1 }, B2: { value: 2 } });
      const f = new RsqFunction({ table: table2, args: [new RangeEntity('A1:A2'), new RangeEntity('B1:B2')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
