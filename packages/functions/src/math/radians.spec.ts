import { RadiansFunction } from './radians';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('radians', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates radians for 180', () => {
      const f = new RadiansFunction({ sheet, args: [new ValueEntity(180)] });
      expect(f.call()).toBeCloseTo(Math.PI);
    });

    it('calculates radians for 0', () => {
      const f = new RadiansFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });

    it('calculates radians for negative degrees', () => {
      const f = new RadiansFunction({ sheet, args: [new ValueEntity(-90)] });
      expect(f.call()).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new RadiansFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new RadiansFunction({ sheet, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
