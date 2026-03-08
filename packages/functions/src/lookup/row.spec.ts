import { RowFunction } from './row';
import { Table, FormulaError, RangeEntity, RefEntity, ValueEntity } from '@gridsheet/react-core';

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
        jest.spyOn(table, 'getPointById').mockReturnValue({ y: 3, x: 5 } as any);
        const f = new RowFunction({
          table,
          args: [],
          at: '?',
        });
        expect(f.call()).toBe(3);
        jest.restoreAllMocks();
      }
    });
  });
});
