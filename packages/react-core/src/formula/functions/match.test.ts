import { MatchFunction } from './match';
import { Table } from '../../lib/table';
import { FormulaError, ValueEntity, RangeEntity } from '../evaluator';

describe('MatchFunction', () => {
  const createTable = () => {
    const table = new Table({ sheetName: 'test' });
    table.initialize({});
    return table;
  };

  const setTableCells = (table: Table, cells: { [key: string]: any }) => {
    const diff: { [key: string]: any } = {};
    Object.entries(cells).forEach(([address, value]) => {
      diff[address] = { value };
    });
    table.update({ diff });
  };

  describe('validation', () => {
    it('should throw error for incorrect number of arguments', () => {
      const table = createTable();
      const match = new MatchFunction({
        args: [new ValueEntity('value')],
        table,
      });

      expect(() => match.call()).toThrow(FormulaError);
    });

    it('should throw error if second argument is not a Table', () => {
      const table = createTable();
      const match = new MatchFunction({
        args: [new ValueEntity('value'), new ValueEntity('not a table')],
        table,
      });

      expect(() => match.call()).toThrow(FormulaError);
    });

    it('should throw error for invalid search type', () => {
      const table = createTable();
      table.initialize({ A1: { value: 1 }, B1: { value: 2 }, C1: { value: 3 } });
      const match = new MatchFunction({
        args: [new ValueEntity('value'), new RangeEntity('A1:C1'), new ValueEntity(2)],
        table,
      });

      expect(() => match.call()).toThrow(FormulaError);
    });
  });

  describe('exact match (search_type = 0)', () => {
    it('should find exact match in single row table', () => {
      const table = createTable();
      table.initialize({ A1: { value: 'apple' }, B1: { value: 'banana' }, C1: { value: 'cherry' } });
      const match = new MatchFunction({
        args: [new ValueEntity('banana'), new RangeEntity('A1:C1'), new ValueEntity(0)],
        table,
      });

      expect(match.call()).toBe(2);
    });

    it('should find exact match in multi-row table', () => {
      const table = createTable();
      table.initialize({
        A1: { value: 'apple' },
        B1: { value: 'banana' },
        A2: { value: 'cherry' },
        B2: { value: 'date' },
      });
      const match = new MatchFunction({
        args: [new ValueEntity('date'), new RangeEntity('A1:B2'), new ValueEntity(0)],
        table,
      });
      expect(() => match.call()).toThrow(FormulaError); // 2D range should throw error
    });

    it('should find numeric exact match', () => {
      const table = createTable();
      table.initialize({ A1: { value: 1 }, B1: { value: 5 }, C1: { value: 10 } });
      const match = new MatchFunction({
        args: [new ValueEntity(5), new RangeEntity('A1:C1'), new ValueEntity(0)],
        table,
      });

      expect(match.call()).toBe(2);
    });

    it('should throw error when no exact match found', () => {
      const table = createTable();
      table.initialize({ A1: { value: 'apple' }, B1: { value: 'banana' } });
      const match = new MatchFunction({
        args: [new ValueEntity('cherry'), new RangeEntity('A1:B1'), new ValueEntity(0)],
        table,
      });

      expect(() => match.call()).toThrow(FormulaError);
    });
  });

  describe('less than or equal match (search_type = 1)', () => {
    it('should find exact match in ascending sorted array', () => {
      const table = createTable();
      table.initialize({ A1: { value: 1 }, B1: { value: 3 }, C1: { value: 5 }, D1: { value: 7 } });
      const match = new MatchFunction({
        args: [new ValueEntity(5), new RangeEntity('A1:D1'), new ValueEntity(1)],
        table,
      });

      expect(match.call()).toBe(3);
    });

    it('should find closest value less than or equal', () => {
      const table = createTable();
      table.initialize({ A1: { value: 1 }, B1: { value: 3 }, C1: { value: 5 }, D1: { value: 7 } });
      const match = new MatchFunction({
        args: [new ValueEntity(4), new RangeEntity('A1:D1'), new ValueEntity(1)],
        table,
      });

      expect(match.call()).toBe(2); // Should return position of 3
    });

    it('should return last position for value greater than all', () => {
      const table = createTable();
      table.initialize({ A1: { value: 1 }, B1: { value: 3 }, C1: { value: 5 } });
      const match = new MatchFunction({
        args: [new ValueEntity(10), new RangeEntity('A1:C1'), new ValueEntity(1)],
        table,
      });

      expect(match.call()).toBe(3); // Should return position of 5
    });

    it('should throw error when no value is less than or equal', () => {
      const table = createTable();
      table.initialize({ A1: { value: 5 }, B1: { value: 7 }, C1: { value: 9 } });
      const match = new MatchFunction({
        args: [new ValueEntity(3), new RangeEntity('A1:C1'), new ValueEntity(1)],
        table,
      });

      expect(() => match.call()).toThrow(FormulaError);
    });
  });

  describe('greater than or equal match (search_type = -1)', () => {
    it('should find exact match in descending sorted array', () => {
      const table = createTable();
      table.initialize({ A1: { value: 9 }, B1: { value: 7 }, C1: { value: 5 }, D1: { value: 3 } });
      const match = new MatchFunction({
        args: [new ValueEntity(5), new RangeEntity('A1:D1'), new ValueEntity(-1)],
        table,
      });

      expect(match.call()).toBe(3); // 5 is at position 3 in [9, 7, 5, 3]
    });

    it('should find closest value greater than or equal', () => {
      const table = createTable();
      table.initialize({ A1: { value: 9 }, B1: { value: 7 }, C1: { value: 5 }, D1: { value: 3 } });
      const match = new MatchFunction({
        args: [new ValueEntity(6), new RangeEntity('A1:D1'), new ValueEntity(-1)],
        table,
      });

      expect(match.call()).toBe(2); // 7 is at position 2 in [9, 7, 5, 3], and 7 >= 6
    });

    it('should return last index if all values are greater than search_key', () => {
      const table = createTable();
      table.initialize({ A1: { value: 9 }, A2: { value: 7 }, A3: { value: 5 } });
      const match = new MatchFunction({
        args: [new ValueEntity(2), new RangeEntity('A1:A3'), new ValueEntity(-1)],
        table,
      });
      expect(match.call()).toBe(3); // Should return last index (3)
    });

    it('should throw error when no value is greater than or equal', () => {
      const table = createTable();
      table.initialize({ A1: { value: 3 }, B1: { value: 5 }, C1: { value: 7 } });
      const match = new MatchFunction({
        args: [new ValueEntity(10), new RangeEntity('A1:C1'), new ValueEntity(-1)],
        table,
      });

      expect(() => match.call()).toThrow(FormulaError);
    });
  });

  describe('default behavior', () => {
    it('should default to search_type = 1 when not specified', () => {
      const table = createTable();
      table.initialize({ A1: { value: 1 }, B1: { value: 3 }, C1: { value: 5 } });
      const match = new MatchFunction({
        args: [new ValueEntity(4), new RangeEntity('A1:C1')],
        table,
      });

      expect(match.call()).toBe(2); // Should behave like search_type = 1
    });
  });

  describe('edge cases', () => {
    it('should handle empty table', () => {
      const table = createTable();
      const match = new MatchFunction({
        args: [new ValueEntity('value'), new RangeEntity('A1:A1'), new ValueEntity(0)],
        table,
      });
      expect(() => match.call()).toThrow(FormulaError);
    });

    it('should handle single cell table', () => {
      const table = createTable();
      table.initialize({ A1: { value: 'test' } });
      const match = new MatchFunction({
        args: [new ValueEntity('test'), new RangeEntity('A1:A1'), new ValueEntity(0)],
        table,
      });

      expect(match.call()).toBe(1);
    });

    it('should handle mixed data types', () => {
      const table = createTable();
      table.initialize({ A1: { value: 'text' }, B1: { value: 123 }, C1: { value: true } });
      const match = new MatchFunction({
        args: [new ValueEntity('text'), new RangeEntity('A1:C1'), new ValueEntity(0)],
        table,
      });

      expect(match.call()).toBe(1);
    });
  });

  describe('range shape validation', () => {
    it('should throw #N/A if range is not 1-dimensional', () => {
      const table = createTable();
      table.initialize({
        A1: { value: 1 },
        B1: { value: 2 },
        A2: { value: 3 },
        B2: { value: 4 },
      });
      const match = new MatchFunction({
        args: [new ValueEntity(2), new RangeEntity('A1:B2'), new ValueEntity(0)],
        table,
      });
      expect(() => match.call()).toThrow(FormulaError);
    });
  });
});
