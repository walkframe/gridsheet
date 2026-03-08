import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class TodayFunction extends BaseFunction {
  example = 'TODAY()';
  helpText = ['Returns the current date as a Date value.'];
  helpArgs: HelpArg[] = [];
  category: FunctionCategory = 'time';

  protected validate() {
    if (this.bareArgs.length !== 0) {
      throw new FormulaError('#N/A', 'Number of arguments for TODAY is incorrect.');
    }
  }

  protected main() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
