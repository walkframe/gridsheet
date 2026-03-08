import { TanFunction } from './tan';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('tan', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('calculates tan of 0', () => {
      const f = new TanFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });

    it('calculates tan of PI/4', () => {
      const f = new TanFunction({ table, args: [new ValueEntity(Math.PI / 4)] });
      expect(f.call()).toBeCloseTo(1);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new TanFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new TanFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
