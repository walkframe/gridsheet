import { FactFunction } from './fact';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('fact', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('calculates fact of 5', () => {
      const f = new FactFunction({ table, args: [new ValueEntity(5)] });
      expect(f.call()).toBe(120);
    });

    it('calculates fact of 0', () => {
      const f = new FactFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(1);
    });

    it('floors the number before calculation', () => {
      const f = new FactFunction({ table, args: [new ValueEntity(5.9)] });
      expect(f.call()).toBe(120);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new FactFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('negative number', () => {
      const f = new FactFunction({ table, args: [new ValueEntity(-1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new FactFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
