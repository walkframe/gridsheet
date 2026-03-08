import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

export class MonthFunction extends BaseFunction {
  example = 'MONTH(A1)';
  helpText = ['Returns the month of a given date as a number (1=January, 12=December).'];
  helpArgs: HelpArg[] = [{ name: 'date', description: 'The date from which to extract the month.', type: ['date'] }];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for MONTH is incorrect.');
    }
  }

  protected main(date: any) {
    return ensureDate(date).getMonth() + 1;
  }
}
