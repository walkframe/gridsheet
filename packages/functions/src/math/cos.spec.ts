import { CosFunction } from './cos';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('cos', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('calculates cos of 0', () => {
      const f = new CosFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });

    it('calculates cos of PI', () => {
      const f = new CosFunction({ table, args: [new ValueEntity(Math.PI)] });
      expect(f.call()).toBeCloseTo(-1);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new CosFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new CosFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
