import { AbsFunction } from './abs';
import { Table } from '../../lib/table';
import { FormulaError, RefEntity, ValueEntity } from '../evaluator';

describe('abs', () => {
  const table = new Table({});
  table.initialize({ B2: { value: -222 } });
  describe('normal', () => {
    it('negative to positive', () => {
      const f = new AbsFunction({ table, args: [new ValueEntity(-111)] });
      expect(f.call()).toBe(111);
    });
    it('refers to a cell', () => {
      const f = new AbsFunction({ table, args: [new RefEntity('B2')] });
      expect(f.call()).toBe(222);
    });
    it('positive to positive', () => {
      const f = new AbsFunction({ table, args: [new ValueEntity(333)] });
      expect(f.call()).toBe(333);
    });
  });
  describe('validation error', () => {
    it('missing argument', () => {
      const f = new AbsFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
