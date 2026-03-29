import { ReplaceFunction } from './replace';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('replace', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('replaces part of string', () => {
      const f = new ReplaceFunction({
        sheet,
        args: [new ValueEntity('Hello World'), new ValueEntity(7), new ValueEntity(5), new ValueEntity('Excel')],
      });
      expect(f.call()).toBe('Hello Excel');
    });

    it('handles surrogate pairs correctly', () => {
      const f = new ReplaceFunction({
        sheet,
        args: [new ValueEntity('a🎵b'), new ValueEntity(2), new ValueEntity(1), new ValueEntity('x')],
      });
      expect(f.call()).toBe('axb');
    });

    it('inserts if length is 0', () => {
      const f = new ReplaceFunction({
        sheet,
        args: [new ValueEntity('HelloWorld'), new ValueEntity(6), new ValueEntity(0), new ValueEntity(' ')],
      });
      expect(f.call()).toBe('Hello World');
    });

    it('replaces beyond string length', () => {
      const f = new ReplaceFunction({
        sheet,
        args: [new ValueEntity('abc'), new ValueEntity(4), new ValueEntity(2), new ValueEntity('d')],
      });
      expect(f.call()).toBe('abcd');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new ReplaceFunction({ sheet, args: [new ValueEntity('text')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
