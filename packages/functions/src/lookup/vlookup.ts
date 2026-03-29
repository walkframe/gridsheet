import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { Sheet } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Searches vertically for the specified key in the first column of the range and returns the value of the specified cell in the same row.`;

export class VlookupFunction extends BaseFunction {
  example = 'VLOOKUP(10003, A2:B26, 2, FALSE)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'key', description: 'Search key.', acceptedTypes: ['any'] },
    {
      name: 'range',
      description: 'A range for search',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
    },
    {
      name: 'index',
      description: 'The index of the column in the range.',
      acceptedTypes: ['number'],
    },
    {
      name: 'is_sorted',
      description:
        'FALSE: Exact match. This is recommended. TRUE: Approximate match. Before you use an approximate match, sort your search key in ascending order. Otherwise, you may likely get a wrong return value.',
      acceptedTypes: ['boolean'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'lookup';

  protected main(key: any, range: Sheet, index: number, isSorted: boolean) {
    const matrix = this.toMatrix(range);
    if (isSorted) {
      let last = -1;
      for (let y = 0; y <= range.numRows; y++) {
        const v = matrix[y]?.[0];
        if (v == null) {
          continue;
        }
        if (v <= key) {
          last = y;
        } else {
          break;
        }
      }
      if (last !== -1) {
        return matrix[last]?.[index - 1];
      }
    } else {
      for (let y = 0; y <= range.numRows; y++) {
        if (matrix[y]?.[0] === key) {
          return matrix[y]?.[index - 1];
        }
      }
    }
    throw new FormulaError('#N/A', `No values found for '${key}'.`);
  }
}
