import { RowFunction } from './row';
import { Sheet, FormulaError, RangeEntity, RefEntity, ValueEntity } from '@gridsheet/react-core';

describe('row', () => {
  const sheet = new Sheet({});
  sheet.initialize({
    A4: { value: 9999 },
  });
  describe('normal', () => {
    it('eq', () => {
      {
        const f = new RowFunction({
          sheet,
          args: [new RefEntity('C100')],
        });
        expect(f.call()).toBe(100);
      }
      {
        jest.spyOn(sheet, 'getPointById').mockReturnValue({ y: 3, x: 5 } as any);
        const f = new RowFunction({
          sheet,
          args: [],
          at: '?',
        });
        expect(f.call()).toBe(3);
        jest.restoreAllMocks();
      }
    });
  });
});
