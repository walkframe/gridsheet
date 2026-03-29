import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the total number of sheets in the spreadsheet.`;

export class SheetsFunction extends BaseFunction {
  example = 'SHEETS()';
  description = description;
  defs: FunctionArgumentDefinition[] = [];
  category: FunctionCategory = 'information';

  protected main() {
    const sheetIdsByName = this.sheet.registry.sheetIdsByName;
    const count = Object.keys(sheetIdsByName).length;
    // If wire has no registered sheets (e.g. standalone sheet), return 1
    return count === 0 ? 1 : count;
  }
}
