import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { Sheet } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Searches horizontally for the specified key in the first row of the range and returns the value of the specified cell in the same column.`;

export class HlookupFunction extends BaseFunction {
  example = 'HLOOKUP(10003, A2:Z6, 2, FALSE)';
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
      description: 'The index of the row in the range.',
      acceptedTypes: ['number'],
    },
    {
      name: 'is_sorted',
      description:
        'FALSE: Exact match. This is recommended. TRUE: Approximate match. Before you use an approximate match, sort your search key in ascending order. Otherwise, you may likely get a wrong return value.',
      optional: true,
      acceptedTypes: ['boolean'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected main(key: any, range: Sheet, index: number, isSorted: boolean) {
    const matrix = this.toMatrix(range);
    if (isSorted) {
      let last = -1;
      for (let x = 0; x <= range.numCols; x++) {
        const v = matrix[0]?.[x];
        if (v == null) {
          continue;
        }
        if (v <= key) {
          last = x;
        } else {
          break;
        }
      }
      if (last !== -1) {
        return matrix[index - 1]?.[last];
      }
    } else {
      for (let x = 0; x <= range.numCols; x++) {
        if (matrix[0]?.[x] === key) {
          return matrix[index - 1]?.[x];
        }
      }
    }
    throw new FormulaError('#N/A', `No values found for '${key}'.`);
  }
}
