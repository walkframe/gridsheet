import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class DateFunction extends BaseFunction {
  example = 'DATE(2024, 3, 15)';
  helpText = ['Returns a Date value representing the specified year, month, and day.'];
  helpArgs: HelpArg[] = [
    { name: 'year', description: 'The year component of the date.', type: ['number'] },
    { name: 'month', description: 'The month component of the date (1=January, 12=December).', type: ['number'] },
    { name: 'day', description: 'The day component of the date.', type: ['number'] },
  ];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 3) {
      throw new FormulaError('#N/A', 'Number of arguments for DATE is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(year: number, month: number, day: number) {
    // month is 1-based in DATE(), but Date constructor uses 0-based month
    return new Date(year, month - 1, day);
  }
}
