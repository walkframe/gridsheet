import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class SheetsFunction extends BaseFunction {
  example = 'SHEETS()';
  helpText = ['Returns the total number of sheets in the spreadsheet.'];
  helpArgs: HelpArg[] = [];
  category: FunctionCategory = 'information';

  protected validate() {
    if (this.bareArgs.length > 0) {
      throw new FormulaError('#N/A', 'Number of arguments for SHEETS is incorrect.');
    }
  }

  protected main() {
    const sheetIdsByName = this.table.wire.sheetIdsByName;
    const count = Object.keys(sheetIdsByName).length;
    // If wire has no registered sheets (e.g. standalone table), return 1
    return count === 0 ? 1 : count;
  }
}
