import { AverageifsFunction } from './averageifs';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('averageifs', () => {
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
    it('calculates average with single condition', () => {
      const f = new AverageifsFunction({
        sheet,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3'), new ValueEntity('Apple')],
      });
      // (10 + 30) / 2 = 20
      expect(f.call()).toBe(20);
    });

    it('calculates average with multiple conditions', () => {
      const f = new AverageifsFunction({
        sheet,
        args: [
          new RangeEntity('A1:A3'),
          new RangeEntity('B1:B3'),
          new ValueEntity('Apple'),
          new RangeEntity('A1:A3'),
          new ValueEntity('>15'),
        ],
      });
      // Only A3 (30) matches both
      expect(f.call()).toBe(30);
    });
  });

  describe('validation error', () => {
    it('returns error with no matching cells', () => {
      const f = new AverageifsFunction({
        sheet,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3'), new ValueEntity('Orange')],
      });
      const result = f.call();
      expect(result).toBeInstanceOf(FormulaError);
    });

    it('throws error when args are insufficient', () => {
      const f = new AverageifsFunction({
        sheet,
        args: [new RangeEntity('A1:A3'), new RangeEntity('B1:B3')],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
