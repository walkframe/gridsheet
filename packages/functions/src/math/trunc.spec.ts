import { TruncFunction } from './trunc';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('trunc', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('truncates to 0 places by default', () => {
      const f = new TruncFunction({ sheet, args: [new ValueEntity(3.14159)] });
      expect(f.call()).toBe(3);
    });

    it('truncates positive number to specified places', () => {
      const f = new TruncFunction({ sheet, args: [new ValueEntity(3.14159), new ValueEntity(2)] });
      expect(f.call()).toBe(3.14);
    });

    it('truncates negative number to specified places', () => {
      const f = new TruncFunction({ sheet, args: [new ValueEntity(-3.14159), new ValueEntity(2)] });
      expect(f.call()).toBe(-3.14);
    });

    it('truncates with negative places', () => {
      const f = new TruncFunction({ sheet, args: [new ValueEntity(1234.5), new ValueEntity(-2)] });
      expect(f.call()).toBe(1200);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new TruncFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new TruncFunction({ sheet, args: [new ValueEntity(1), new ValueEntity(2), new ValueEntity(3)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type for value', () => {
      const f = new TruncFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
