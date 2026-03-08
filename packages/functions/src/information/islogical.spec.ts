import { IslogicalFunction } from './islogical';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('islogical', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns true for boolean true', () => {
      const f = new IslogicalFunction({ table, args: [new ValueEntity(true)] });
      expect(f.call()).toBe(true);
    });

    it('returns true for boolean false', () => {
      const f = new IslogicalFunction({ table, args: [new ValueEntity(false)] });
      expect(f.call()).toBe(true);
    });

    it('returns false for numbers', () => {
      const f = new IslogicalFunction({ table, args: [new ValueEntity(1)] });
      expect(f.call()).toBe(false);
    });

    it('returns false for strings', () => {
      const f = new IslogicalFunction({ table, args: [new ValueEntity('true')] });
      expect(f.call()).toBe(false);
    });
  });

  describe('validation error', () => {
    it('throws error if missing argument', () => {
      const f = new IslogicalFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
