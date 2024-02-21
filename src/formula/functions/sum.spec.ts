import { SumFunction } from './sum';
import { Table } from '../../lib/table';
import { FormulaError, RangeEntity, RefEntity, ValueEntity } from '../evaluator';

describe('sum', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 5 },
    A2: { value: '=-(9 * 10) - 4' },
    B50: { value: 25 },
    C15: { value: 'not a number' },
    C20: { value: 10 },
  });

  describe('normal', () => {
    it('sum single values', () => {
      const f = new SumFunction({
        table,
        args: [new RefEntity('B50'), new ValueEntity(5), new ValueEntity(-3)],
      });
      expect(f.call()).toBe(27);
    });
    it('sum range', () => {
      const f = new SumFunction({
        table,
        args: [new RangeEntity('A2:E20'), new ValueEntity(30)],
      });
      // -90 - 4 + 10 + 30
      expect(f.call()).toBe(-54);
    });
  });
  describe('validation error', () => {
    it('missing argument', () => {
      const f = new SumFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
