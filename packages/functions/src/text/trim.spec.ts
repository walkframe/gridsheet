import { TrimFunction } from './trim';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('trim', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('trims leading spaces', () => {
      const f = new TrimFunction({ sheet, args: [new ValueEntity('  hello')] });
      expect(f.call()).toBe('hello');
    });

    it('trims trailing spaces', () => {
      const f = new TrimFunction({ sheet, args: [new ValueEntity('world   ')] });
      expect(f.call()).toBe('world');
    });

    it('trims leading and trailing spaces', () => {
      const f = new TrimFunction({ sheet, args: [new ValueEntity('  hello world  ')] });
      expect(f.call()).toBe('hello world');
    });

    it('converts number to string and trims (though numbers have no spaces)', () => {
      const f = new TrimFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe('123');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new TrimFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
