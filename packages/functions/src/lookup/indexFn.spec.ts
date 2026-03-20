import { IndexFunction } from './indexFn';
import { Sheet, FormulaError } from '@gridsheet/react-core';
import type { AreaType } from '@gridsheet/react-core';

describe('IndexFunction', () => {
  const indexFunction = (args: any[]) => {
    return new IndexFunction({
      args: args.map((arg) => ({ evaluate: () => arg }) as any),
      sheet: {} as any,
    });
  };

  // area: top=1, left=2, bottom=5, right=3 (1-indexed)
  const createTestTable = (area: AreaType = { top: 1, left: 2, bottom: 5, right: 3 }) => {
    const sheet = new Sheet({});
    (sheet as any).area = area;
    return sheet;
  };

  describe('validation', () => {
    it('should throw error for incorrect number of arguments', () => {
      expect(() => indexFunction([]).call()).toThrow(FormulaError);
      expect(() => indexFunction([]).call()).toThrow('Number of arguments for INDEX is incorrect.');

      expect(() => indexFunction([1, 2, 3, 4]).call()).toThrow(FormulaError);
      expect(() => indexFunction([1, 2, 3, 4]).call()).toThrow('Number of arguments for INDEX is incorrect.');
    });

    it('should throw error for invalid first argument', () => {
      expect(() => indexFunction(['not a sheet']).call()).toThrow(FormulaError);
      expect(() => indexFunction(['not a sheet']).call()).toThrow('First argument must be a range.');

      expect(() => indexFunction([[1, 2, 3]]).call()).toThrow(FormulaError);
      expect(() => indexFunction([[1, 2, 3]]).call()).toThrow('First argument must be a range.');
    });

    it('should throw error for invalid row number', () => {
      const sheet = createTestTable();
      expect(() => indexFunction([sheet, -1]).call()).toThrow(FormulaError);
      expect(() => indexFunction([sheet, -1]).call()).toThrow('Row number must be greater than or equal to 0.');
    });

    it('should throw error for invalid column number', () => {
      const sheet = createTestTable();
      expect(() => indexFunction([sheet, 1, -1]).call()).toThrow(FormulaError);
      expect(() => indexFunction([sheet, 1, -1]).call()).toThrow('Column number must be greater than or equal to 0.');
    });

    it('should accept valid arguments', () => {
      const sheet = createTestTable();
      expect(() => indexFunction([sheet]).call()).not.toThrow();
      expect(() => indexFunction([sheet, 1]).call()).not.toThrow();
      expect(() => indexFunction([sheet, 1, 2]).call()).not.toThrow();
      expect(() => indexFunction([sheet, 0, 0]).call()).not.toThrow();
    });
  });

  describe('area checks', () => {
    it('should return full area for INDEX(sheet)', () => {
      const sheet = createTestTable();
      const result = indexFunction([sheet]).call();
      expect(result.getArea()).toEqual({ top: 1, left: 2, bottom: 5, right: 3 });
    });
    it('should return full area for INDEX(sheet, 0, 0)', () => {
      const sheet = createTestTable();
      const result = indexFunction([sheet, 0, 0]).call();
      expect(result.getArea()).toEqual({ top: 1, left: 2, bottom: 5, right: 3 });
    });
    it('should return correct area for INDEX(sheet, 2)', () => {
      const sheet = createTestTable();
      const result = indexFunction([sheet, 2]).call();
      expect(result.getArea()).toEqual({ top: 2, left: 2, bottom: 2, right: 3 });
    });
    it('should return correct area for INDEX(sheet, 0, 2)', () => {
      const sheet = createTestTable();
      const result = indexFunction([sheet, 0, 2]).call();
      expect(result.getArea()).toEqual({ top: 1, left: 3, bottom: 5, right: 3 });
    });
    it('should return correct area for INDEX(sheet, 2, 2)', () => {
      const sheet = createTestTable();
      const result = indexFunction([sheet, 2, 2]).call();
      // top=bottom=1+2-1, left=right=2+2-1
      expect(result.getArea()).toEqual({ top: 2, left: 3, bottom: 2, right: 3 });
    });
  });

  describe('area validation', () => {
    it('should return entire sheet when no row or column specified', () => {
      const sheet = createTestTable();

      const result = indexFunction([sheet]).call();
      expect(result).toBeInstanceOf(Sheet);
    });

    it('should return entire sheet when row and column are 0', () => {
      const sheet = createTestTable();

      const result = indexFunction([sheet, 0, 0]).call();
      expect(result).toBeInstanceOf(Sheet);
    });

    it('should return single row sheet when only row is specified', () => {
      const sheet = createTestTable();

      const result = indexFunction([sheet, 2]).call();
      expect(result).toBeInstanceOf(Sheet);
    });

    it('should return single row sheet when column is 0', () => {
      const sheet = createTestTable();

      const result = indexFunction([sheet, 2, 0]).call();
      expect(result).toBeInstanceOf(Sheet);
    });

    it('should return single column sheet when only column is specified', () => {
      const sheet = createTestTable();

      const result = indexFunction([sheet, 0, 2]).call();
      expect(result).toBeInstanceOf(Sheet);
    });

    it('should return single cell sheet when row and column are specified', () => {
      const sheet = createTestTable();

      const result = indexFunction([sheet, 2, 2]).call();
      expect(result).toBeInstanceOf(Sheet);
    });
  });

  describe('edge cases', () => {
    it('should throw error for out-of-range row', () => {
      const sheet = createTestTable();
      expect(() => indexFunction([sheet, 6]).call()).toThrow(FormulaError);
      expect(() => indexFunction([sheet, 6]).call()).toThrow('Row number 6 is out of range.');
    });

    it('should throw error for out-of-range column', () => {
      const sheet = createTestTable();
      expect(() => indexFunction([sheet, 1, 4]).call()).toThrow(FormulaError);
      expect(() => indexFunction([sheet, 1, 4]).call()).toThrow('Column number 4 is out of range.');
    });
  });
});
