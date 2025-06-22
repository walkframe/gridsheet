import { EqFunction } from './eq';
import { Table } from '../../lib/table';
import { FormulaError, RefEntity, ValueEntity } from '../evaluator';

describe('eq', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 101 },
    A2: { value: 101 },
    A3: { value: 103 },
    B1: { value: 'abc' },
    B2: { value: 'abcd' },
    C1: { value: new Date('2022-05-23T12:34:56+09:00') },
    C2: { value: new Date('2022-05-23T12:34:56.999+09:00') },
    C3: { value: new Date('2022-05-23T12:34:56Z') },
    D4: { value: '=1/0' },
    E5: { value: null },
  });

  describe('normal', () => {
    it('A1=101 is true', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('A1'), new ValueEntity(101)],
      });
      expect(f.call()).toBe(true);
    });
    it('A1=A2 is true', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('A1'), new RefEntity('A2')],
      });
      expect(f.call()).toBe(true);
    });
    it('A1=A3 is false', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('A1'), new RefEntity('A3')],
      });
      expect(f.call()).toBe(false);
    });
    it('B1=abc is true', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('B1'), new ValueEntity('abc')],
      });
      expect(f.call()).toBe(true);
    });
    it('B1=B2 is false', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('B1'), new RefEntity('B2')],
      });
      expect(f.call()).toBe(false);
    });
    it('C1=raw date  is true', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('C1'), new ValueEntity(new Date('2022-05-23T12:34:56+09:00'))],
      });
      expect(f.call()).toBe(true);
    });
    it('C1=C2 is false', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('C1'), new RefEntity('C2')],
      });
      expect(f.call()).toBe(false);
    });
    it('C1=C3 is false', () => {
      const f = new EqFunction({
        table,
        args: [new RefEntity('C1'), new RefEntity('C3')],
      });
      expect(f.call()).toBe(false);
    });
    it('null is blank', () => {
      const f = new EqFunction({
        table,
        args: [new ValueEntity(null), new ValueEntity('')],
      });
      expect(f.call()).toBe(true);
    });
  });
  describe('validation error', () => {
    it('missing argument', () => {
      const f = new EqFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
