import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

export class YearFunction extends BaseFunction {
  example = 'YEAR(A1)';
  helpText = ['Returns the year of a given date.'];
  helpArgs: HelpArg[] = [{ name: 'date', description: 'The date from which to extract the year.', type: ['date'] }];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for YEAR is incorrect.');
    }
  }

  protected main(date: any) {
    return ensureDate(date).getFullYear();
  }
}
