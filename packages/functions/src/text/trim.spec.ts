import { TrimFunction } from './trim';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('trim', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('trims leading spaces', () => {
      const f = new TrimFunction({ table, args: [new ValueEntity('  hello')] });
      expect(f.call()).toBe('hello');
    });

    it('trims trailing spaces', () => {
      const f = new TrimFunction({ table, args: [new ValueEntity('world   ')] });
      expect(f.call()).toBe('world');
    });

    it('trims leading and trailing spaces', () => {
      const f = new TrimFunction({ table, args: [new ValueEntity('  hello world  ')] });
      expect(f.call()).toBe('hello world');
    });

    it('converts number to string and trims (though numbers have no spaces)', () => {
      const f = new TrimFunction({ table, args: [new ValueEntity(123)] });
      expect(f.call()).toBe('123');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new TrimFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
