import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { stripMatrix, matrixShape } from '@gridsheet/react-core';
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
    const validated = super.validate(args);

    validated[0] = stripMatrix(validated[0], this.at);

    const matrix = this.toMatrix(validated[1]);
    const { rows, cols } = matrixShape({ matrix });
    if (!((rows === 1 && cols >= 1) || (cols === 1 && rows >= 1))) {
      throw new FormulaError('#N/A', 'Range must be a single row or single column.');
    }
    validated[1] = matrix;

    if (validated.length < 3) {
      validated[2] = 1;
    } else if (![-1, 0, 1].includes(validated[2])) {
      throw new FormulaError('#VALUE!', 'Match type must be -1, 0, or 1.');
    }

    return validated;
  }

  protected main(searchKey: any, range: any[][], searchType: number = 1) {
    const array = range.reduce((acc: any[], row: any[]) => acc.concat(row), []);

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
