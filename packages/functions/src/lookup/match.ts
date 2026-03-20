import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Sheet, solveSheet, stripSheet, ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Searches for a value in a sheet and returns its position.
Returns the position of the matched value (1-based index).`;

export class MatchFunction extends BaseFunction {
  example = 'MATCH("apple", A1:A10, 0)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'search_key', description: 'The value to search for.', acceptedTypes: ['any'] },
    { name: 'range', description: 'The range to search in.', takesMatrix: true, acceptedTypes: ['matrix'] },
    {
      name: 'search_type',
      description: '0 for exact match, 1 for less than or equal, -1 for greater than or equal.',
      acceptedTypes: ['number'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'lookup';

  protected validate(args: any[]): any[] {
    if (args.length < 2 || args.length > 3) {
      throw new FormulaError('#N/A', 'Number of arguments for MATCH is incorrect.');
    }

    if (args[0] instanceof Sheet) {
      args[0] = stripSheet({ value: args[0] });
    }

    if (!(args[1] instanceof Sheet)) {
      throw new FormulaError('#VALUE!', 'Second argument must be a range.');
    }

    if (args.length === 3) {
      args[2] = ensureNumber(args[2]);
      if (![-1, 0, 1].includes(args[2])) {
        throw new FormulaError('#VALUE!', 'Match type must be -1, 0, or 1.');
      }
    } else {
      args[2] = 1; // Default to 1 (less than or equal)
    }
    return args;
  }

  protected main(searchKey: any, range: Sheet, searchType: number = 1) {
    const matrix = solveSheet({ sheet: range });
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

      case 1: {
        // Less than or equal (data must be sorted ascending)
        let lastMatch = -1;
        for (let i = 0; i < array.length; i++) {
          if (array[i] <= searchKey) {
            lastMatch = i;
          } else {
            break;
          }
        }
        if (lastMatch === -1) {
          throw new FormulaError('#N/A', 'Value not found in range.');
        }
        return lastMatch + 1;
      }

      case -1: {
        // Greater than or equal (data must be sorted descending)
        let lastMatch = -1;
        for (let i = 0; i < array.length; i++) {
          if (array[i] >= searchKey) {
            lastMatch = i;
          } else {
            break;
          }
        }
        if (lastMatch === -1) {
          throw new FormulaError('#N/A', 'Value not found in range.');
        }
        return lastMatch + 1;
      }

      default:
        throw new FormulaError('#VALUE!', 'Invalid match type.');
    }
  }
}
