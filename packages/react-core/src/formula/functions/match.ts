import { FormulaError } from '../evaluator';
import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';
import { stripTable } from '../../formula/solver';

export class MatchFunction extends BaseFunction {
  example = 'MATCH("apple", A1:A10, 0)';
  helpText = [
    'Searches for a value in a table and returns its position.',
    'Returns the position of the matched value (1-based index).',
  ];
  helpArgs = [
    { name: 'search_key', description: 'The value to search for.' },
    { name: 'range', description: 'The range to search in.' },
    {
      name: 'search_type',
      description: '0 for exact match, 1 for less than or equal, -1 for greater than or equal.',
      optional: true,
    },
  ];

  protected validate() {
    if (this.bareArgs.length < 2 || this.bareArgs.length > 3) {
      throw new FormulaError('#N/A', 'Number of arguments for MATCH is incorrect.');
    }

    if (this.bareArgs[0] instanceof Table) {
      this.bareArgs[0] = stripTable({ value: this.bareArgs[0] });
    }

    if (!(this.bareArgs[1] instanceof Table)) {
      throw new FormulaError('#VALUE!', 'Second argument must be a range.');
    }

    if (this.bareArgs.length === 3) {
      this.bareArgs[2] = ensureNumber(this.bareArgs[2]);
      if (![-1, 0, 1].includes(this.bareArgs[2])) {
        throw new FormulaError('#VALUE!', 'Match type must be -1, 0, or 1.');
      }
    } else {
      this.bareArgs[2] = 1; // Default to 1 (less than or equal)
    }
  }

  protected main(searchKey: any, range: Table, searchType: number = 1) {
    const matrix = solveTable({ table: range });
    // Check if matrix is 1-dimensional (either 1 row or 1 column)
    const numRows = matrix.length;
    const numCols = matrix[0]?.length || 0;
    if (!((numRows === 1 && numCols >= 1) || (numCols === 1 && numRows >= 1))) {
      throw new FormulaError('#N/A', 'Range must be a single row or single column.');
    }
    const array = matrix.reduce((acc, row) => acc.concat(row), []);

    if (array.length === 0) {
      throw new FormulaError('#N/A', 'range is empty.');
    }

    switch (searchType) {
      case 0: // Exact match
        for (let i = 0; i < array.length; i++) {
          if (array[i] === searchKey) {
            return i + 1; // 1-based index
          }
        }
        throw new FormulaError('#N/A', 'Value not found in range.');

      case 1: // Less than or equal (assumes sorted ascending)
        for (let i = array.length - 1; i >= 0; i--) {
          if (array[i] <= searchKey) {
            return i + 1; // 1-based index
          }
        }
        throw new FormulaError('#N/A', 'No value less than or equal to lookup value.');

      case -1: // Greater than or equal (assumes sorted descending)
        let lastIdx = -1;
        for (let i = 0; i < array.length; i++) {
          if (Number(array[i]) >= Number(searchKey)) {
            lastIdx = i;
          }
        }
        if (lastIdx !== -1) {
          return lastIdx + 1; // 1-based index
        }
        throw new FormulaError('#N/A', 'No value greater than or equal to lookup value.');

      default:
        throw new FormulaError('#VALUE!', 'Invalid search type.');
    }
  }
}
