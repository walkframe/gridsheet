import { IstextFunction } from './istext';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('istext', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns true for string', () => {
      const f = new IstextFunction({ table, args: [new ValueEntity('text')] });
      expect(f.call()).toBe(true);
    });

    it('returns true for empty string', () => {
      const f = new IstextFunction({ table, args: [new ValueEntity('')] });
      expect(f.call()).toBe(true);
    });

    it('returns false for number', () => {
      const f = new IstextFunction({ table, args: [new ValueEntity(123)] });
      expect(f.call()).toBe(false);
    });

    it('returns false for boolean', () => {
      const f = new IstextFunction({ table, args: [new ValueEntity(true)] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IstextFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
