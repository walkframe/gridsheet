import { LowerFunction } from './lower';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('lower', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('converts uppercase to lowercase', () => {
      const f = new LowerFunction({ sheet, args: [new ValueEntity('HELLO WORLD')] });
      expect(f.call()).toBe('hello world');
    });

    it('leaves lowercase as is', () => {
      const f = new LowerFunction({ sheet, args: [new ValueEntity('hello world')] });
      expect(f.call()).toBe('hello world');
    });

    it('leaves non-alphabetic characters as is', () => {
      const f = new LowerFunction({ sheet, args: [new ValueEntity('123 ABC !')] });
      expect(f.call()).toBe('123 abc !');
    });

    it('converts number to string and processes', () => {
      const f = new LowerFunction({ sheet, args: [new ValueEntity(123)] });
      expect(f.call()).toBe('123');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new LowerFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
