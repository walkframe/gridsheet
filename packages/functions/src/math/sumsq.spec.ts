import { SumsqFunction } from './sumsq';
import { Sheet, FormulaError, ValueEntity, RangeEntity } from '@gridsheet/core';

describe('sumsq', () => {
  const sheet = new Sheet({});
  sheet.initialize({ A1: { value: 3 }, A2: { value: 4 } });

  describe('normal', () => {
    it('calculates sum of squares for values', () => {
      const f = new SumsqFunction({ sheet, args: [new ValueEntity(3), new ValueEntity(4)] });
      expect(f.call()).toBe(25); // 9 + 16
    });

    it('calculates sum of squares for sheet range', () => {
      const f = new SumsqFunction({ sheet, args: [new RangeEntity('A1:A2')] });
      expect(f.call()).toBe(25);
    });

    it('calculates sum of squares combining values and ranges', () => {
      const f = new SumsqFunction({ sheet, args: [new RangeEntity('A1:A2'), new ValueEntity(5)] });
      expect(f.call()).toBe(50); // 25 + 25
    });
  });

  describe('validation error', () => {
    it('throws on empty args', () => {
      const f = new SumsqFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('ignores invalid types correctly if ignore: true but might fail in strict ensureNumber?', () => {
      const f = new SumsqFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
