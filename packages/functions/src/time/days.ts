import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class DaysFunction extends BaseFunction {
  example = 'DAYS(A2, A1)';
  helpText = ['Returns the number of days between two dates.'];
  helpArgs: HelpArg[] = [
    { name: 'end_date', description: 'The end date.', type: ['date'] },
    { name: 'start_date', description: 'The start date.', type: ['date'] },
  ];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for DAYS is incorrect.');
    }
  }

  protected main(endDate: any, startDate: any) {
    const end = ensureDate(endDate);
    const start = ensureDate(startDate);
    return Math.trunc((end.getTime() - start.getTime()) / MS_PER_DAY);
  }
}
