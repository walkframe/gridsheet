import { IsoddFunction } from './isodd';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('isodd', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns true for an odd number', () => {
      const f = new IsoddFunction({ table, args: [new ValueEntity(3)] });
      expect(f.call()).toBe(true);
    });

    it('returns false for an even number', () => {
      const f = new IsoddFunction({ table, args: [new ValueEntity(4)] });
      expect(f.call()).toBe(false);
    });

    it('returns true for negative odd number', () => {
      const f = new IsoddFunction({ table, args: [new ValueEntity(-3)] });
      expect(f.call()).toBe(true);
    });

    it('floors the number before checking', () => {
      const f = new IsoddFunction({ table, args: [new ValueEntity(3.5)] }); // Math.floor(3.5) -> 3
      expect(f.call()).toBe(true);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IsoddFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new IsoddFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
