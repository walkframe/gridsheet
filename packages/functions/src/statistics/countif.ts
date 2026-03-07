import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table, solveTable, ensureString, check, conditionArg } from '@gridsheet/react-core';

export class CountifFunction extends BaseFunction {
  example = 'COUNTIF(A1:A10,">20")';
  helpText = ['Returns the count of a series of cells.'];
  helpArgs: HelpArg[] = [{ name: 'range', description: 'Target range.', type: ['range'] }, conditionArg];

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
