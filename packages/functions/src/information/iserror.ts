import { FormulaError } from '@gridsheet/react-core';
import type { HelpArg, FunctionProps } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';

export class IserrorFunction {
  example = 'ISERROR(A1)';
  helpText = ['Returns TRUE if the value is any error value.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to check for an error.',
      type: ['any'],
    },
  ];
  category: FunctionCategory = 'information';

  private args: any[];
  private table: Table;

  constructor({ args, table }: FunctionProps) {
    this.args = args;
    this.table = table;
  }

  public call() {
    if (this.args.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for ISERROR is incorrect.');
    }
    try {
      const value = this.args[0].evaluate({ table: this.table });
      return value instanceof FormulaError;
    } catch (e) {
      return e instanceof FormulaError;
    }
  }
}
