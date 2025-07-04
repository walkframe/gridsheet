import { FormulaError } from '../evaluator';
import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { BaseFunction } from './__base';
import { ensureBoolean, ensureNumber } from './__utils';
import { stripTable } from '../../formula/solver';

export class HlookupFunction extends BaseFunction {
  example = 'HLOOKUP(10003, A2:Z6, 2, FALSE)';
  helpText = [
    'Searches horizontally for the specified key in the first row of the range and returns the value of the specified cell in the same column.',
  ];
  helpArgs = [
    { name: 'key', description: 'Search key.' },
    {
      name: 'range',
      description: 'A range for search',
    },
    {
      name: 'index',
      description: 'The index of the row in the range.',
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
      throw new FormulaError('#N/A', 'Number of arguments for HLOOKUP is incorrect.');
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
      for (let x = 0; x <= range.getNumCols(); x++) {
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
      for (let x = 0; x <= range.getNumCols(); x++) {
        if (matrix[0]?.[x] === key) {
          return matrix[index - 1]?.[x];
        }
      }
    }
    throw new FormulaError('#N/A', `No values found for '${key}'.`);
  }
}
