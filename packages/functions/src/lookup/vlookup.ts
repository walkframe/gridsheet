import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Sheet, solveSheet, stripSheet, ensureBoolean, ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

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

  protected validate(args: any[]): any[] {
    if (args.length !== 3 && args.length !== 4) {
      throw new FormulaError('#N/A', 'Number of arguments for VLOOKUP is incorrect.');
    }
    if (args[0] instanceof Sheet) {
      args[0] = stripSheet({ value: args[0] });
    }
    if (!(args[1] instanceof Sheet)) {
      throw new FormulaError('#REF!', '2nd argument must be range');
    }
    args[2] = ensureNumber(args[2]);
    args[3] = ensureBoolean(args[3], { alternative: true });
    return args;
  }

  protected main(key: any, range: Sheet, index: number, isSorted: boolean) {
    const matrix = solveSheet({ sheet: range });
    if (isSorted) {
      let last = -1;
      for (let y = 0; y <= range.getNumRows(); y++) {
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
      for (let y = 0; y <= range.getNumRows(); y++) {
        if (matrix[y]?.[0] === key) {
          return matrix[y]?.[index - 1];
        }
      }
    }
    throw new FormulaError('#N/A', `No values found for '${key}'.`);
  }
}
