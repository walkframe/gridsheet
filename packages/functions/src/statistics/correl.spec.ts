import { CorrelFunction } from './correl';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('correl', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 1 },
    A2: { value: 2 },
    A3: { value: 3 },
    B1: { value: 2 },
    B2: { value: 4 },
    B3: { value: 6 }, // perfect positive correlation
    C1: { value: 3 },
    C2: { value: 2 },
    C3: { value: 1 }, // perfect negative correlation
  });

  describe('normal', () => {
    it('returns 1 for perfect positive correlation', () => {
      const f = new CorrelFunction({ sheet, args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3')] });
      expect(f.call() as number).toBeCloseTo(1, 10);
    });

    it('returns -1 for perfect negative correlation', () => {
      const f = new CorrelFunction({ sheet, args: [new RangeEntity('A1:A3'), new RangeEntity('C1:C3')] });
      expect(f.call() as number).toBeCloseTo(-1, 10);
    });
  });

  describe('validation error', () => {
    it('throws when ranges have different lengths', () => {
      const f = new CorrelFunction({ sheet, args: [new RangeEntity('A1:A2'), new RangeEntity('B1:B3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws when a range has constant values (stdev=0)', () => {
      const table2 = new Sheet({});
      table2.initialize({ A1: { value: 5 }, A2: { value: 5 }, B1: { value: 1 }, B2: { value: 2 } });
      const f = new CorrelFunction({ sheet: table2, args: [new RangeEntity('A1:A2'), new RangeEntity('B1:B2')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
