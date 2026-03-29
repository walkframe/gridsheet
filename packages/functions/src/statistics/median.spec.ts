import { MedianFunction } from './median';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('median', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 1 },
    A2: { value: 3 },
    A3: { value: 5 },
    A4: { value: 2 },
    A5: { value: 4 },
    B1: { value: 'text' },
    B2: { value: null },
  });

  describe('normal', () => {
    it('returns median of odd count', () => {
      const f = new MedianFunction({ sheet, args: [new RangeEntity('A1:A3')] });
      // sorted: 1,3,5 → 3
      expect(f.call()).toBe(3);
    });

    it('returns median of even count (average of two middle values)', () => {
      const f = new MedianFunction({ sheet, args: [new RangeEntity('A1:A4')] });
      // sorted: 1,2,3,5 → (2+3)/2 = 2.5
      expect(f.call()).toBe(2.5);
    });

    it('accepts individual values', () => {
      const f = new MedianFunction({ sheet, args: [new ValueEntity(10), new ValueEntity(20), new ValueEntity(30)] });
      expect(f.call()).toBe(20);
    });

    it('ignores text and blank cells in range', () => {
      const f = new MedianFunction({ sheet, args: [new RangeEntity('A1:B2')] });
      // numeric: 1, 3 → (1+3)/2 = 2
      expect(f.call()).toBe(2);
    });
  });

  describe('validation error', () => {
    it('throws on no numeric values', () => {
      const f = new MedianFunction({ sheet, args: [new RangeEntity('B1:B2')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws on zero args', () => {
      const f = new MedianFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
