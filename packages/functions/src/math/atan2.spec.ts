import { Atan2Function } from './atan2';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('atan2', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('calculates atan2 of 4, 3', () => {
      const f = new Atan2Function({ sheet, args: [new ValueEntity(4), new ValueEntity(3)] });
      expect(f.call()).toBeCloseTo(0.927295218);
    });

    it('calculates atan2 of 0, 0', () => {
      const f = new Atan2Function({ sheet, args: [new ValueEntity(0), new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing arguments', () => {
      const f = new Atan2Function({ sheet, args: [new ValueEntity(4)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type for x', () => {
      const f = new Atan2Function({ sheet, args: [new ValueEntity('invalid'), new ValueEntity(3)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type for y', () => {
      const f = new Atan2Function({ sheet, args: [new ValueEntity(4), new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
