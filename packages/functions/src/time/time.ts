import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class TimeFunction extends BaseFunction {
  example = 'TIME(13, 30, 0)';
  helpText = [
    'Returns a Date value representing the specified hour, minute, and second (on the base date 1899-12-30).',
  ];
  helpArgs: HelpArg[] = [
    { name: 'hour', description: 'The hour component (0–23).', type: ['number'] },
    { name: 'minute', description: 'The minute component (0–59).', type: ['number'] },
    { name: 'second', description: 'The second component (0–59).', type: ['number'] },
  ];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 3) {
      throw new FormulaError('#N/A', 'Number of arguments for TIME is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(hour: number, minute: number, second: number) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute, second, 0);
  }
}
