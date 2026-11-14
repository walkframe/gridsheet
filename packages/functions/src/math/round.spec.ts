import { RoundFunction } from './round';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/engine';

describe('round', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('rounds to 0 decimal places by default', () => {
      const f = new RoundFunction({ sheet, args: [new ValueEntity(99.44)] });
      expect(f.call()).toBe(99);
    });

    it('rounds to specified decimal places', () => {
      const f = new RoundFunction({ sheet, args: [new ValueEntity(99.44), new ValueEntity(1)] });
      expect(f.call()).toBe(99.4);
    });

    it('rounds up if next digit is 5 or more', () => {
      const f = new RoundFunction({ sheet, args: [new ValueEntity(99.45), new ValueEntity(1)] });
      expect(f.call()).toBe(99.5);
    });

    it('rounds with negative precision', () => {
      const f = new RoundFunction({ sheet, args: [new ValueEntity(1234.56), new ValueEntity(-2)] });
      expect(f.call()).toBe(1200);
    });

    // https://github.com/walkframe/gridsheet/issues/163
    it.each([
      [1.005, 2, 1.01],
      [35.855, 2, 35.86],
      [1.045, 2, 1.05],
      [2.5, 0, 3],
      [-2.5, 0, -3],
      [-1.005, 2, -1.01],
      [-0.4, 0, 0],
      [1e-7, 2, 0],
      [1.55e21, -20, 1.6e21],
      [15, -1, 20],
    ])('ROUND(%p, %p) = %p (no float scaling error, half away from zero)', (value, digit, expected) => {
      const f = new RoundFunction({ sheet, args: [new ValueEntity(value), new ValueEntity(digit)] });
      expect(f.call()).toBe(expected);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new RoundFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new RoundFunction({ sheet, args: [new ValueEntity(1), new ValueEntity(2), new ValueEntity(3)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
