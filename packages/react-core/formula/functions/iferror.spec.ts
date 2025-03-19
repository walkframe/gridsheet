import { IfErrorFunction } from './iferror';
import { Table } from '../../lib/table';
import { FormulaError, FunctionEntity, RangeEntity, RefEntity, ValueEntity } from '../evaluator';

describe('iferror', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: '=100/5' },
    B2: { value: '=100/0' },
    C3: { value: '=C3' },
    D4: { value: '=A2:E10' },
    E5: { value: '=aaaaa' },
  });

  describe('normal', () => {
    it('no errors', () => {
      const f = new IfErrorFunction({
        table,
        args: [new RefEntity('A1'), new ValueEntity('div 0')],
      });
      expect(f.call()).toBe(20);
    });
    it('div/0 error', () => {
      const f = new IfErrorFunction({
        table,
        args: [new RefEntity('B2'), new ValueEntity('div 0')],
      });
      expect(f.call()).toBe('div 0');
    });
    it('reference error', () => {
      const f = new IfErrorFunction({
        table,
        args: [new RangeEntity('C3'), new RefEntity('A1')],
      });
      expect(f.call()).toBe(20);
    });
    it('range error', () => {
      const f = new IfErrorFunction({
        table,
        args: [new RangeEntity('A2:E20')],
      });
      expect(f.call()).toBe(undefined);
    });
    it('name error', () => {
      const f = new IfErrorFunction({
        table,
        args: [
          new FunctionEntity('aaaaaaaaaaaaaaaaa'),
          new FunctionEntity('sum', 0, [new ValueEntity(1), new ValueEntity(2), new ValueEntity(3)]),
        ],
      });
      expect(f.call()).toBe(6);
    });
  });
  describe('validation error', () => {
    it('missing argument', () => {
      const f = new IfErrorFunction({ table, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
