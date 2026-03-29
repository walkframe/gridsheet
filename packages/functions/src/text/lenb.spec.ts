import { LenbFunction } from './lenb';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('lenb', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('returns byte length for ascii string', () => {
      const f = new LenbFunction({ sheet, args: [new ValueEntity('hello')] });
      expect(f.call()).toBe(5);
    });

    it('returns byte length for multibyte string', () => {
      const f = new LenbFunction({ sheet, args: [new ValueEntity('こんにちは')] });
      expect(f.call()).toBe(15); // 5 characters * 3 bytes
    });

    it('returns 0 for empty string', () => {
      const f = new LenbFunction({ sheet, args: [new ValueEntity('')] });
      expect(f.call()).toBe(0);
    });

    it('converts number to string and measures bytes', () => {
      const f = new LenbFunction({ sheet, args: [new ValueEntity(12345)] });
      expect(f.call()).toBe(5);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new LenbFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new LenbFunction({ sheet, args: [new ValueEntity('hello'), new ValueEntity('world')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
