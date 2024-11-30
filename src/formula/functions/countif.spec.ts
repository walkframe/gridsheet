import { CountifFunction } from './countif';
import { Table } from '../../lib/table';
import { FormulaError, RangeEntity, RefEntity, ValueEntity } from '../evaluator';

describe('countif', () => {
  const table = new Table({});
  table.initialize({
    A1: { value: 1 },
    B1: { value: 10 },
    C1: { value: 3 },
    D1: { value: 2 },
    E1: { value: 3 },
    A2: { value: 'a' },
    B2: { value: 'aa' },
    C2: { value: 'a日' },
    D2: { value: 'abc' },
    E2: { value: 'bb' },
    A3: { value: new Date('2022-01-05T00:00:00.000Z') },
    B3: { value: new Date('2022-01-03T00:00:00.000Z') },
    C3: { value: new Date('2022-01-04T00:00:00.000Z') },
    D3: { value: new Date('2022-01-04T00:00:00.000+09:00') },
    A4: { value: null },
    B4: { value: 0 },
    C4: { value: '' },
    D4: { value: false },
    E4: { value: true },
  });
  describe('normal', () => {
    it('eq', () => {
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new ValueEntity('3')],
        });
        expect(f.call()).toBe(2);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new ValueEntity('=3')],
        });
        expect(f.call()).toBe(2);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new RefEntity('E1')],
        });
        expect(f.call()).toBe(2);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('a*')],
        });
        expect(f.call()).toBe(4);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('a?')],
        });
        expect(f.call()).toBe(2);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('?b*')],
        });
        expect(f.call()).toBe(2);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A3:E3'), new ValueEntity(new Date('2022-01-04T00:00:00.000Z'))],
        });
        expect(f.call()).toBe(1);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A4:E4'), new ValueEntity('')],
        });
        expect(f.call()).toBe(2);
      }
    });
    it('ne', () => {
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new ValueEntity('<>3')],
        });
        expect(f.call()).toBe(3);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('<>a*')],
        });
        expect(f.call()).toBe(1);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A4:E4'), new ValueEntity('<>')],
        });
        expect(f.call()).toBe(3);
      }
    });
    it('gt', () => {
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new ValueEntity('>3')],
        });
        expect(f.call()).toBe(1);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('>aa')],
        });
        expect(f.call()).toBe(3);
      }
    });
    it('gte', () => {
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new ValueEntity('>=3')],
        });
        expect(f.call()).toBe(3);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('>=aa')],
        });
        expect(f.call()).toBe(4);
      }
    });
    it('lt', () => {
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new ValueEntity('<3')],
        });
        expect(f.call()).toBe(2);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('<aa')],
        });
        expect(f.call()).toBe(1);
      }
    });
    it('lte', () => {
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A1:E1'), new ValueEntity('<=3')],
        });
        expect(f.call()).toBe(4);
      }
      {
        const f = new CountifFunction({
          table,
          args: [new RangeEntity('A2:E2'), new ValueEntity('<=aa')],
        });
        expect(f.call()).toBe(2);
      }
    });
  });
  describe('validation error', () => {
    it('missing argument', () => {
      {
        const f = new CountifFunction({ table, args: [new RangeEntity('A1:A3')] });
        expect(f.call.bind(f)).toThrow(FormulaError);
      }
    });
  });
});
