import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the sheet number of the specified sheet or reference.`;

export class SheetFunction extends BaseFunction {
  example = 'SHEET(Sheet2!A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description:
        'The reference or sheet whose sheet number will be returned. If omitted, returns the sheet number of the current sheet.',
      optional: true,
      takesMatrix: true,
      acceptedTypes: ['reference'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected main(ref?: Table | any) {
    if (ref == null) {
      return this.table.sheetId;
    }

    if (ref instanceof Table) {
      return ref.sheetId;
    }

    throw new FormulaError('#VALUE!', 'Invalid argument for SHEET.');
  }
}
