import { VlookupFunction } from './vlookup';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('vlookup', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: 10 },
    B1: { value: 'apple' },
    C1: { value: 'red' },
    A2: { value: 20 },
    B2: { value: 'banana' },
    C2: { value: 'yellow' },
    A3: { value: 30 },
    B3: { value: 'cherry' },
    C3: { value: 'red' },
  });

  describe('normal (exact match)', () => {
    it('looks up value exactly', () => {
      const f = new VlookupFunction({
        sheet,
        args: [new ValueEntity(20), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(false)],
      });
      expect(f.call()).toBe('banana');
    });

    it('looks up from 3rd column', () => {
      const f = new VlookupFunction({
        sheet,
        args: [new ValueEntity(30), new RangeEntity('A1:C3'), new ValueEntity(3), new ValueEntity(false)],
      });
      expect(f.call()).toBe('red');
    });
  });

  describe('normal (approximate match / sorted)', () => {
    it('finds largest value less than or equal to key', () => {
      // Data: 10, 20, 30
      const f = new VlookupFunction({
        sheet,
        args: [new ValueEntity(25), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(true)],
      });
      expect(f.call()).toBe('banana'); // Matches 20
    });

    it('finds largest value if key is larger than all', () => {
      const f = new VlookupFunction({
        sheet,
        args: [new ValueEntity(40), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(true)],
      });
      expect(f.call()).toBe('cherry'); // Matches 30
    });
  });

  describe('validation error', () => {
    it('throws if key is not found (exact)', () => {
      const f = new VlookupFunction({
        sheet,
        args: [new ValueEntity(40), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(false)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if key is smaller than all keys (approximate)', () => {
      const f = new VlookupFunction({
        sheet,
        args: [new ValueEntity(5), new RangeEntity('A1:C3'), new ValueEntity(2), new ValueEntity(true)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if incorrect number of arguments', () => {
      const f = new VlookupFunction({ sheet, args: [new ValueEntity(10), new RangeEntity('A1:C3')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws if 2nd arg is not range', () => {
      const f = new VlookupFunction({
        sheet,
        args: [new ValueEntity(10), new ValueEntity('A1:C3'), new ValueEntity(2)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
