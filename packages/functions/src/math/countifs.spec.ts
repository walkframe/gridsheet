import { CountifsFunction } from './countifs';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('countifs', () => {
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
    it('counts with single condition', () => {
      const f = new CountifsFunction({
        sheet,
        args: [new RangeEntity('B1:B3'), new ValueEntity('Apple')],
      });
      expect(f.call()).toBe(2);
    });

    it('counts with multiple conditions', () => {
      const f = new CountifsFunction({
        sheet,
        args: [new RangeEntity('B1:B3'), new ValueEntity('Apple'), new RangeEntity('A1:A3'), new ValueEntity('>15')],
      });
      // Only row 3 matches
      expect(f.call()).toBe(1);
    });
  });

  describe('validation error', () => {
    it('throws error when args are incorrect', () => {
      const f = new CountifsFunction({
        sheet,
        args: [new RangeEntity('B1:B3')],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws error when range is not Sheet instance', () => {
      const f = new CountifsFunction({
        sheet,
        args: [new ValueEntity('not_range'), new ValueEntity('Apple')],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
