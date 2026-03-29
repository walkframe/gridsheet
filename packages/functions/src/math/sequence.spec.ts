import { SequenceFunction } from './sequence';
import { Sheet, FormulaError, ValueEntity, Spilling } from '@gridsheet/core';

describe('sequence', () => {
  const sheet = new Sheet({});
  sheet.initialize({});

  describe('normal', () => {
    it('generates a single column sequence', () => {
      const f = new SequenceFunction({ sheet, args: [new ValueEntity(4)] });
      const result = f.call();
      expect(Spilling.is(result)).toBe(true);
      expect(result.matrix).toEqual([[1], [2], [3], [4]]);
    });

    it('generates a 2D sequence', () => {
      const f = new SequenceFunction({ sheet, args: [new ValueEntity(3), new ValueEntity(2)] });
      const result = f.call();
      expect(Spilling.is(result)).toBe(true);
      expect(result.matrix).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('generates a sequence with custom start', () => {
      const f = new SequenceFunction({
        sheet,
        args: [new ValueEntity(3), new ValueEntity(1), new ValueEntity(10)],
      });
      const result = f.call();
      expect(result.matrix).toEqual([[10], [11], [12]]);
    });

    it('generates a sequence with custom start and step', () => {
      const f = new SequenceFunction({
        sheet,
        args: [new ValueEntity(3), new ValueEntity(2), new ValueEntity(0), new ValueEntity(5)],
      });
      const result = f.call();
      expect(result.matrix).toEqual([
        [0, 5],
        [10, 15],
        [20, 25],
      ]);
    });

    it('generates a single cell (1x1)', () => {
      const f = new SequenceFunction({ sheet, args: [new ValueEntity(1), new ValueEntity(1)] });
      const result = f.call();
      expect(Spilling.is(result)).toBe(true);
      expect(result.matrix).toEqual([[1]]);
    });

    it('generates a sequence with negative step', () => {
      const f = new SequenceFunction({
        sheet,
        args: [new ValueEntity(3), new ValueEntity(1), new ValueEntity(10), new ValueEntity(-3)],
      });
      const result = f.call();
      expect(result.matrix).toEqual([[10], [7], [4]]);
    });

    it('generates a single row', () => {
      const f = new SequenceFunction({ sheet, args: [new ValueEntity(1), new ValueEntity(5)] });
      const result = f.call();
      expect(result.matrix).toEqual([[1, 2, 3, 4, 5]]);
    });
  });

  describe('validation error', () => {
    it('missing argument', () => {
      const f = new SequenceFunction({ sheet, args: [] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('too many arguments', () => {
      const f = new SequenceFunction({
        sheet,
        args: [new ValueEntity(1), new ValueEntity(1), new ValueEntity(1), new ValueEntity(1), new ValueEntity(1)],
      });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('rows less than 1', () => {
      const f = new SequenceFunction({ sheet, args: [new ValueEntity(0)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });

    it('columns less than 1', () => {
      const f = new SequenceFunction({ sheet, args: [new ValueEntity(3), new ValueEntity(0)] });
      expect(f.call.bind(f)).toThrow(FormulaError);
    });
  });
});
