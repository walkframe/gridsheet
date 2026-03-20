import { PiFunction } from './pi';
import { Table, FormulaError, ValueEntity } from '@gridsheet/react-core';

describe('pi', () => {
  const table = new Table({});
  table.initialize({});

  describe('normal', () => {
    it('returns the value of PI', () => {
      const f = new PiFunction({ table, args: [] });
      expect(f.call()).toBe(Math.PI);
    });
  });

  describe('validation error', () => {
    it('has arguments', () => {
      const f = new PiFunction({ table, args: [new ValueEntity(1)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
