import { ColumnFunction } from './column';
import { Table, FormulaError, RangeEntity, RefEntity, ValueEntity } from '@gridsheet/react-core';

describe('column', () => {
  const table = new Table({});
  table.initialize({
    A4: { value: 9999 },
  });
  describe('normal', () => {
    it('eq', () => {
      {
        const f = new ColumnFunction({
          table,
          args: [new RefEntity('C100')],
        });
        expect(f.call()).toBe(3);
      }
      {
        jest.spyOn(table, 'getPointById').mockReturnValue({ y: 3, x: 5 } as any);
        const f = new ColumnFunction({
          table,
          args: [],
          at: '?',
        });
        expect(f.call()).toBe(5);
        jest.restoreAllMocks();
      }
    });
  });
});
