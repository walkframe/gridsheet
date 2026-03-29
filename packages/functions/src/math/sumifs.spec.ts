import { SumifsFunction } from './sumifs';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('sumifs', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 10 },
    A2: { value: 20 },
    A3: { value: 30 },
    B1: { value: 'Apple' },
    B2: { value: 'Banana' },
    B3: { value: 'Apple' },
  });

  describe('normal', () => {
    it('calculates sum with single condition', () => {
      const f = new SumifsFunction({
        sheet,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3'), new ValueEntity('Apple')],
      });
      // 10 + 30
      expect(f.call()).toBe(40);
    });

    it('calculates sum with multiple conditions', () => {
      const f = new SumifsFunction({
        sheet,
        args: [
          new RangeEntity('A1:A3'),
          new RangeEntity('B1:B3'),
          new ValueEntity('Apple'),
          new RangeEntity('A1:A3'),
          new ValueEntity('>15'),
        ],
      });
      // Only A3 (30) matches
      expect(f.call()).toBe(30);
    });
  });

  describe('validation error', () => {
    it('throws error when args are not enough', () => {
      const f = new SumifsFunction({
        sheet,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3')],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws error when first arg is not a range', () => {
      const f = new SumifsFunction({
        sheet,
        args: [new ValueEntity('sum_range'), new RangeEntity('B1:B3'), new ValueEntity('Apple')],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
