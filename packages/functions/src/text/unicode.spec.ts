import { UnicodeFunction } from './unicode';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('unicode', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns code point for regular character', () => {
      const f = new UnicodeFunction({ table, args: [new ValueEntity('A')] });
      expect(f.call()).toBe(65);
    });

    it('returns code point for first character only', () => {
      const f = new UnicodeFunction({ table, args: [new ValueEntity('Apple')] });
      expect(f.call()).toBe(65);
    });

    it('handles surrogate pairs correctly', () => {
      const f = new UnicodeFunction({ table, args: [new ValueEntity('🎵')] });
      expect(f.call()).toBe(127925);
    });

    it('converts numbers to string and gets unicode', () => {
      const f = new UnicodeFunction({ table, args: [new ValueEntity(123)] });
      expect(f.call()).toBe(49); // '1'
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new UnicodeFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('empty string', () => {
      const f = new UnicodeFunction({ table, args: [new ValueEntity('')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
