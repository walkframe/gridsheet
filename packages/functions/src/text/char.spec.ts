import { CharFunction } from './char';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('char', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('converts number to character', () => {
      const f = new CharFunction({ sheet, args: [new ValueEntity(65)] });
      expect(f.call()).toBe('A');
    });

    it('handles unicode characters', () => {
      const f = new CharFunction({ sheet, args: [new ValueEntity(12354)] }); // あ
      expect(f.call()).toBe('あ');
    });

    it('handles surrogate pairs', () => {
      const f = new CharFunction({ sheet, args: [new ValueEntity(127925)] }); // 🎵
      expect(f.call()).toBe('🎵');
    });

    it('truncates decimal numbers', () => {
      const f = new CharFunction({ sheet, args: [new ValueEntity(65.9)] });
      expect(f.call()).toBe('A');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new CharFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new CharFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('code point too small', () => {
      const f = new CharFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('code point too large', () => {
      const f = new CharFunction({ sheet, args: [new ValueEntity(0x110000)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
