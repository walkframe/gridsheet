import { IsformulaFunction } from './isformula';
import { Sheet, FormulaError, RefEntity, ValueEntity, RangeEntity } from '@gridsheet/react-core';

describe('isformula', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A1: { value: '=1+1' },
    A2: { value: 2 },
    A3: { value: 'text' },
  });

  describe('normal', () => {
    it('returns true for cell with formula', () => {
      // isformula expects a Sheet reference logic from BaseFunction.
      // But BaseFunction gets evaluated args passing Sheet if it's a range.
      const ref = new RangeEntity('A1');
      const f = new IsformulaFunction({ sheet, args: [ref] });
      expect(f.call()).toBe(true);
    });

    it('returns false for cell without formula', () => {
      const ref = new RangeEntity('A2');
      const f = new IsformulaFunction({ sheet, args: [ref] });
      expect(f.call()).toBe(false);
    });

    it('returns false for string cell', () => {
      const ref = new RangeEntity('A3');
      const f = new IsformulaFunction({ sheet, args: [ref] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('throws error if argument is not a reference', () => {
      const f = new IsformulaFunction({ sheet, args: [new ValueEntity('A1')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('throws error if missing argument', () => {
      const f = new IsformulaFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
