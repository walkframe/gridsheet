import { FormulaError } from '../evaluator';
import { solveTable } from '../solver';
import { Table } from '../../lib/table';
import { BaseFunction } from './__base';
import { check, ensureString } from './__utils';

export class CountifFunction extends BaseFunction {
  example = 'COUNTIF(A1:A10,">20")';
  helpText = ['Returns the count of a series of cells.'];
  helpArgs = [
    { name: 'range', description: 'Target range.' },
    {
      name: 'condition',
      description: 'A condition for count.',
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for COUNTIF is incorrect.');
    }
    this.bareArgs[1] = ensureString(this.bareArgs[1]);
  }

  protected main(table: Table, condition: string) {
    const matrix = solveTable({ table });
    return matrix.reduce((a, b) => a.concat(b)).filter((v: any) => check(v, condition)).length;
  }
}
