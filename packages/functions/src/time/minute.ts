import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

export class MinuteFunction extends BaseFunction {
  example = 'MINUTE(A1)';
  helpText = ['Returns the minute component of a given time/date value (0–59).'];
  helpArgs: HelpArg[] = [
    {
      name: 'time',
      description: 'The time or date-time value from which to extract the minute.',
      type: ['time', 'date'],
    },
  ];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for MINUTE is incorrect.');
    }
  }

  protected main(time: any) {
    return ensureDate(time).getMinutes();
  }
}
