import { FormulaError } from '@gridsheet/web';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import { Sheet } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

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

  protected main(ref?: Sheet | any) {
    if (ref == null) {
      return this.sheet.id;
    }

    if (ref instanceof Sheet) {
      return ref.id;
    }

    throw new FormulaError('#VALUE!', 'Invalid argument for SHEET.');
  }
}
