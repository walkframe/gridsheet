import { IndexFunction } from './index';
import { Table } from '../../lib/table';
import { FormulaError } from '../evaluator';
import type { AreaType } from '../../types';

describe('IndexFunction', () => {
  const indexFunction = (args: any[]) => {
    return new IndexFunction({
      args: args.map((arg) => ({ evaluate: () => arg }) as any),
      table: {} as any,
    });
  };

  // area: top=1, left=2, bottom=5, right=3 (1-indexed)
  const createTestTable = (area: AreaType = { top: 1, left: 2, bottom: 5, right: 3 }) => {
    const table = new Table({});
    (table as any).area = area;
    return table;
  };

  describe('validation', () => {
    it('should throw error for incorrect number of arguments', () => {
      expect(() => indexFunction([]).call()).toThrow(FormulaError);
      expect(() => indexFunction([]).call()).toThrow('Number of arguments for INDEX is incorrect.');

      expect(() => indexFunction([1, 2, 3, 4]).call()).toThrow(FormulaError);
      expect(() => indexFunction([1, 2, 3, 4]).call()).toThrow('Number of arguments for INDEX is incorrect.');
    });

    it('should throw error for invalid first argument', () => {
      expect(() => indexFunction(['not a table']).call()).toThrow(FormulaError);
      expect(() => indexFunction(['not a table']).call()).toThrow('First argument must be a range.');

      expect(() => indexFunction([[1, 2, 3]]).call()).toThrow(FormulaError);
      expect(() => indexFunction([[1, 2, 3]]).call()).toThrow('First argument must be a range.');
    });

    it('should throw error for invalid row number', () => {
      const table = createTestTable();
      expect(() => indexFunction([table, -1]).call()).toThrow(FormulaError);
      expect(() => indexFunction([table, -1]).call()).toThrow('Row number must be greater than or equal to 0.');
    });

    it('should throw error for invalid column number', () => {
      const table = createTestTable();
      expect(() => indexFunction([table, 1, -1]).call()).toThrow(FormulaError);
      expect(() => indexFunction([table, 1, -1]).call()).toThrow('Column number must be greater than or equal to 0.');
    });

    it('should accept valid arguments', () => {
      const table = createTestTable();
      expect(() => indexFunction([table]).call()).not.toThrow();
      expect(() => indexFunction([table, 1]).call()).not.toThrow();
      expect(() => indexFunction([table, 1, 2]).call()).not.toThrow();
      expect(() => indexFunction([table, 0, 0]).call()).not.toThrow();
    });
  });

  describe('area checks', () => {
    it('should return full area for INDEX(table)', () => {
      const table = createTestTable();
      const result = indexFunction([table]).call();
      expect(result.getArea()).toEqual({ top: 1, left: 2, bottom: 5, right: 3 });
    });
    it('should return full area for INDEX(table, 0, 0)', () => {
      const table = createTestTable();
      const result = indexFunction([table, 0, 0]).call();
      expect(result.getArea()).toEqual({ top: 1, left: 2, bottom: 5, right: 3 });
    });
    it('should return correct area for INDEX(table, 2)', () => {
      const table = createTestTable();
      const result = indexFunction([table, 2]).call();
      expect(result.getArea()).toEqual({ top: 2, left: 2, bottom: 2, right: 3 });
    });
    it('should return correct area for INDEX(table, 0, 2)', () => {
      const table = createTestTable();
      const result = indexFunction([table, 0, 2]).call();
      expect(result.getArea()).toEqual({ top: 1, left: 3, bottom: 5, right: 3 });
    });
    it('should return correct area for INDEX(table, 2, 2)', () => {
      const table = createTestTable();
      const result = indexFunction([table, 2, 2]).call();
      // top=bottom=1+2-1, left=right=2+2-1
      expect(result.getArea()).toEqual({ top: 2, left: 3, bottom: 2, right: 3 });
    });
  });

  describe('area validation', () => {
    it('should return entire table when no row or column specified', () => {
      const table = createTestTable();

      const result = indexFunction([table]).call();
      expect(result).toBeInstanceOf(Table);
    });

    it('should return entire table when row and column are 0', () => {
      const table = createTestTable();

      const result = indexFunction([table, 0, 0]).call();
      expect(result).toBeInstanceOf(Table);
    });

    it('should return single row table when only row is specified', () => {
      const table = createTestTable();

      const result = indexFunction([table, 2]).call();
      expect(result).toBeInstanceOf(Table);
    });

    it('should return single row table when column is 0', () => {
      const table = createTestTable();

      const result = indexFunction([table, 2, 0]).call();
      expect(result).toBeInstanceOf(Table);
    });

    it('should return single column table when only column is specified', () => {
      const table = createTestTable();

      const result = indexFunction([table, 0, 2]).call();
      expect(result).toBeInstanceOf(Table);
    });

    it('should return single cell table when row and column are specified', () => {
      const table = createTestTable();

      const result = indexFunction([table, 2, 2]).call();
      expect(result).toBeInstanceOf(Table);
    });
  });

  describe('edge cases', () => {
    it('should throw error for out-of-range row', () => {
      const table = createTestTable();
      expect(() => indexFunction([table, 6]).call()).toThrow(FormulaError);
      expect(() => indexFunction([table, 6]).call()).toThrow('Row number 6 is out of range.');
    });

    it('should throw error for out-of-range column', () => {
      const table = createTestTable();
      expect(() => indexFunction([table, 1, 4]).call()).toThrow(FormulaError);
      expect(() => indexFunction([table, 1, 4]).call()).toThrow('Column number 4 is out of range.');
    });
  });
});
