import { ColumnFunction } from './column';
import { Sheet, FormulaError, RangeEntity, RefEntity, ValueEntity } from '@gridsheet/core';

describe('column', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A4: { value: 9999 },
  });
  describe('normal', () => {
    it('eq', () => {
      {
        const f = new ColumnFunction({
          sheet,
          args: [new RefEntity('C100')],
        });
        expect(f.call()).toBe(3);
      }
      {
        jest.spyOn(sheet, 'getPointById').mockReturnValue({ y: 3, x: 5 } as any);
        const f = new ColumnFunction({
          sheet,
          args: [],
          at: '?',
        });
        expect(f.call()).toBe(5);
        jest.restoreAllMocks();
      }
    });
  });
});
