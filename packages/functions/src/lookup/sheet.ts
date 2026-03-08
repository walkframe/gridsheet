import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { Table } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class SheetFunction extends BaseFunction {
  example = 'SHEET(Sheet2!A1)';
  helpText = ['Returns the sheet number of the specified sheet or reference.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description:
        'The reference or sheet whose sheet number will be returned. If omitted, returns the sheet number of the current sheet.',
      optional: true,
      type: ['reference', 'range'],
    },
  ];
  category: FunctionCategory = 'lookup';

  protected validate() {
    if (this.bareArgs.length > 1) {
      throw new FormulaError('#N/A', 'Number of arguments for SHEET is incorrect.');
    }
  }

  protected main(ref?: Table | any) {
    if (ref === undefined || ref === null) {
      // No argument: return current sheet's index (1-based)
      const sheetIdsByName = this.table.wire.sheetIdsByName;
      const sheetNames = Object.keys(sheetIdsByName);
      const currentSheetId = this.table.sheetId;
      const index = sheetNames.findIndex((name) => sheetIdsByName[name] === currentSheetId);
      return index === -1 ? 1 : index + 1;
    }

    if (ref instanceof Table) {
      const sheetIdsByName = ref.wire.sheetIdsByName;
      const sheetNames = Object.keys(sheetIdsByName);
      const refSheetId = ref.sheetId;
      const index = sheetNames.findIndex((name) => sheetIdsByName[name] === refSheetId);
      return index === -1 ? 1 : index + 1;
    }

    throw new FormulaError('#VALUE!', 'Invalid argument for SHEET.');
  }
}
