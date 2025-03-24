import { ColFunction } from './col';
import { Table } from '../../lib/table';
import { FormulaError, RangeEntity, RefEntity, ValueEntity } from '../evaluator';

describe('col', () => {
  const table = new Table({});
  table.initialize({
    A4: { value: 9999 },
  });
  describe('normal', () => {
    it('eq', () => {
      {
        const f = new ColFunction({
          table,
          args: [new RefEntity('C100')],
        });
        expect(f.call()).toBe(3);
      }
      {
        const f = new ColFunction({
          table,
          args: [],
          origin: { x: 5, y: 3 },
        });
        expect(f.call()).toBe(5);
      }
    });
  });
});
