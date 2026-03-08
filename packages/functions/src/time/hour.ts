import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

export class HourFunction extends BaseFunction {
  example = 'HOUR(A1)';
  helpText = ['Returns the hour component of a given time/date value (0–23).'];
  helpArgs: HelpArg[] = [
    {
      name: 'time',
      description: 'The time or date-time value from which to extract the hour.',
      type: ['time', 'date'],
    },
  ];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for HOUR is incorrect.');
    }
  }

  protected main(time: any) {
    return ensureDate(time).getHours();
  }
}
