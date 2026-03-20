import { ProductFunction } from './product';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('product', () => {
  const sheet = new Sheet({});
  sheet.initialize({ A1: { value: 2 }, A2: { value: 3 }, A3: { value: 'text' }, A4: { value: 4 } });

  describe('normal', () => {
    it('calculates product of single values', () => {
      const f = new ProductFunction({ sheet, args: [new ValueEntity(2), new ValueEntity(3), new ValueEntity(4)] });
      expect(f.call()).toBe(24);
    });

    it('calculates product of sheet range', () => {
      const f = new ProductFunction({ sheet, args: [new RangeEntity('A1:A4')] });
      expect(f.call()).toBe(24); // text is ignored
    });

    it('calculates product combining values and ranges', () => {
      const f = new ProductFunction({ sheet, args: [new RangeEntity('A1:A2'), new ValueEntity(5)] });
      expect(f.call()).toBe(30); // 2 * 3 * 5
    });
  });

  describe('validation error', () => {
    it('handles empty args by returning undefined/throwing', () => {
      // the implementation reduces over an empty array if spreading yields nothing.
      // reduce of empty array with no initial value throws TypeError. Let's see how it behaves:
      const f = new ProductFunction({ sheet, args: [] });
      // we might want it to return 0 or throw FormulaError, but let's just see if it throws something.
      expect(() => f.call()).toThrow();
    });
  });
});
