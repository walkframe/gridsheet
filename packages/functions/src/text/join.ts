import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table, solveTable, stripTable, ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class JoinFunction extends BaseFunction {
  example = 'JOIN(", ", A1:A5)';
  helpText = [
    'Joins the elements of one or more 1D arrays or values using a delimiter.',
    'If the delimiter is omitted the result is similar to CONCATENATE.',
  ];
  helpArgs: HelpArg[] = [
    { name: 'delimiter', description: 'The string to place between joined values.', type: ['string'] },
    { name: 'value_or_array1', description: 'A value or array to join.', type: ['any', 'range'] },
    {
      name: 'value_or_array2',
      description: 'Additional values or arrays to join.',
      type: ['any', 'range'],
      optional: true,
      iterable: true,
    },
  ];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length < 2) {
      throw new FormulaError('#N/A', 'JOIN requires at least 2 arguments.');
    }
    this.bareArgs[0] = ensureString(this.bareArgs[0]);
  }

  protected main(delimiter: string, ...rest: any[]) {
    const parts: string[] = [];
    for (const arg of rest) {
      if (arg instanceof Table) {
        const matrix = solveTable({ table: arg });
        for (const row of matrix) {
          for (const cell of row) {
            parts.push(ensureString(stripTable({ value: cell })));
          }
        }
      } else {
        parts.push(ensureString(arg));
      }
    }
    return parts.join(delimiter);
  }
}
