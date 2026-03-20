import { UnaryPercentFunction } from './unaryPercent';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('unaryPercent', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('divides a positive number by 100', () => {
      const f = new UnaryPercentFunction({ table, args: [new ValueEntity(50)] });
      expect(f.call()).toBe(0.5);
    });

    it('divides a negative number by 100', () => {
      const f = new UnaryPercentFunction({ table, args: [new ValueEntity(-25)] });
      expect(f.call()).toBe(-0.25);
    });

    it('handles zero correctly', () => {
      const f = new UnaryPercentFunction({ table, args: [new ValueEntity(0)] });
      expect(f.call()).toBe(0);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new UnaryPercentFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('invalid type', () => {
      const f = new UnaryPercentFunction({ table, args: [new ValueEntity('invalid')] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
