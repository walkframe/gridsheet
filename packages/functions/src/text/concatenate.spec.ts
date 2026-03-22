import { ConcatenateFunction } from './concatenate';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('concatenate', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('concatenates two strings', () => {
      const f = new ConcatenateFunction({ sheet, args: [new ValueEntity('Hello'), new ValueEntity('World')] });
      expect(f.call()).toBe('HelloWorld');
    });

    it('concatenates multiple strings', () => {
      const f = new ConcatenateFunction({
        sheet,
        args: [new ValueEntity('A'), new ValueEntity('B'), new ValueEntity('C')],
      });
      expect(f.call()).toBe('ABC');
    });

    it('converts numbers to string', () => {
      const f = new ConcatenateFunction({ sheet, args: [new ValueEntity(1), new ValueEntity(2)] });
      expect(f.call()).toBe('12');
    });
  });

  describe('validation error', () => {
    it('throws if no arguments given', () => {
      const f = new ConcatenateFunction({ sheet, args: [] });
      expect(() => f.call()).toThrow(); // reduce of empty array with no initial value
    });
  });
});
