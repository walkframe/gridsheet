import { UpperFunction } from './upper';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('upper', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('converts lowercase to uppercase', () => {
      const f = new UpperFunction({ sheet, args: [new ValueEntity('hello world')] });
      expect(f.call()).toBe('HELLO WORLD');
    });

    it('leaves uppercase as is', () => {
      const f = new UpperFunction({ sheet, args: [new ValueEntity('HELLO WORLD')] });
      expect(f.call()).toBe('HELLO WORLD');
    });

    it('leaves non-alphabetic characters as is', () => {
      const f = new UpperFunction({ sheet, args: [new ValueEntity('123 abc !')] });
      expect(f.call()).toBe('123 ABC !');
    });

    it('converts number to string and processes', () => {
      const f = new UpperFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe('123');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new UpperFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
