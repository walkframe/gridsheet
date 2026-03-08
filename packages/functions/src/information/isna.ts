import { FormulaError } from '@gridsheet/react-core';
import type { HelpArg, FunctionProps } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';

export class IsnaFunction {
  example = 'ISNA(A1)';
  helpText = ['Returns TRUE if the value is the #N/A error value.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to check for the #N/A error.',
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
      throw new FormulaError('#N/A', 'Number of arguments for ISNA is incorrect.');
    }
    try {
      const value = this.args[0].evaluate({ table: this.table });
      return value instanceof FormulaError && value.code === '#N/A';
    } catch (e) {
      if (e instanceof FormulaError) {
        return e.code === '#N/A';
      }
      return false;
    }
  }
}
