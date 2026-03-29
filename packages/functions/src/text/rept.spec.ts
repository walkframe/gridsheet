import { ReptFunction } from './rept';
import { Sheet, FormulaError, ValueEntity } from '@gridsheet/core';

describe('rept', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('repeats string multiple times', () => {
      const f = new ReptFunction({ sheet, args: [new ValueEntity('ha'), new ValueEntity(3)] });
      expect(f.call()).toBe('hahaha');
    });

    it('returns empty string if times is 0', () => {
      const f = new ReptFunction({ sheet, args: [new ValueEntity('ha'), new ValueEntity(0)] });
      expect(f.call()).toBe('');
    });

    it('floors the number of times', () => {
      const f = new ReptFunction({ sheet, args: [new ValueEntity('ha'), new ValueEntity(3.9)] });
      expect(f.call()).toBe('hahaha');
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new ReptFunction({ sheet, args: [new ValueEntity('ha')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('negative times', () => {
      const f = new ReptFunction({ sheet, args: [new ValueEntity('ha'), new ValueEntity(-1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
