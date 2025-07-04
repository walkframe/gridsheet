import { FormulaError } from '../evaluator';
import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { BaseFunction } from './__base';
import { ensureBoolean, ensureNumber } from './__utils';
import { stripTable } from '../../formula/solver';

export class VlookupFunction extends BaseFunction {
  example = 'VLOOKUP(10003, A2:B26, 2, FALSE)';
  helpText = [
    'Searches vertically for the specified key in the first column of the range and returns the value of the specified cell in the same row.',
  ];
  helpArgs = [
    { name: 'key', description: 'Search key.' },
    {
      name: 'range',
      description: 'A range for search',
    },
    {
      name: 'index',
      description: 'The index of the column in the range.',
    },
    {
      name: 'is_sorted',
      description:
        'FALSE: Exact match. This is recommended. TRUE: Approximate match. Before you use an approximate match, sort your search key in ascending order. Otherwise, you may likely get a wrong return value.',
      option: true,
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 3 && this.bareArgs.length !== 4) {
      throw new FormulaError('#N/A', 'Number of arguments for VLOOKUP is incorrect.');
    }
    if (this.bareArgs[0] instanceof Table) {
      this.bareArgs[0] = stripTable({ value: this.bareArgs[0] });
    }
    if (!(this.bareArgs[1] instanceof Table)) {
      throw new FormulaError('#REF!', '2nd argument must be range');
    }
    this.bareArgs[2] = ensureNumber(this.bareArgs[2]);
    this.bareArgs[3] = ensureBoolean(this.bareArgs[3], { alternative: true });
  }

  protected main(key: any, range: Table, index: number, isSorted: boolean) {
    const matrix = solveTable({ table: range });
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
