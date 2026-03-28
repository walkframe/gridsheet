import { UnicharFunction } from './unichar';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('unichar', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('converts number to unichar', () => {
      const f = new UnicharFunction({ sheet, args: [new ValueEntity(9731)] });
      expect(f.call()).toBe('☃');
    });

    it('handles surrogate pairs', () => {
      const f = new UnicharFunction({ sheet, args: [new ValueEntity(127925)] });
      expect(f.call()).toBe('🎵');
    });

    it('truncates decimal values', () => {
      const f = new UnicharFunction({ sheet, args: [new ValueEntity(9731.9)] });
      expect(f.call()).toBe('☃');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new UnicharFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value too small', () => {
      const f = new UnicharFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('value too large', () => {
      const f = new UnicharFunction({ sheet, args: [new ValueEntity(0x110000)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
