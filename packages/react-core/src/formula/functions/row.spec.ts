import { RowFunction } from './row';
import { Table } from '../../lib/table';
import { FormulaError, RangeEntity, RefEntity, ValueEntity } from '../evaluator';

describe('row', () => {
  const table = new Table({});
  table.initialize({
    A4: { value: 9999 },
  });
  describe('normal', () => {
    it('eq', () => {
      {
        const f = new RowFunction({
          table,
          args: [new RefEntity('C100')],
        });
        expect(f.call()).toBe(100);
      }
      {
        const f = new RowFunction({
          table,
          args: [],
          origin: { x: 5, y: 3 },
        });
        expect(f.call()).toBe(3);
      }
    });
  });
});
