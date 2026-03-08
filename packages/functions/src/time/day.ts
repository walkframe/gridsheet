import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

export class DayFunction extends BaseFunction {
  example = 'DAY(A1)';
  helpText = ['Returns the day of the month for a given date (1–31).'];
  helpArgs: HelpArg[] = [{ name: 'date', description: 'The date from which to extract the day.', type: ['date'] }];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for DAY is incorrect.');
    }
  }

  protected main(date: any) {
    return ensureDate(date).getDate();
  }
}
