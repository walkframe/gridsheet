import { AtanFunction } from './atan';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('atan', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('calculates atan of 1', () => {
      const f = new AtanFunction({ table, args: [new ValueEntity(1)] });
      expect(f.call()).toBeCloseTo(Math.PI / 4);
    });

    it('calculates atan of 0', () => {
      const f = new AtanFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new AtanFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new AtanFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
