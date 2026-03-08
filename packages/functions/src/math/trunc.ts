import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class TruncFunction extends BaseFunction {
  example = 'TRUNC(3.14159, 2)';
  helpText = ['Truncates a number to a certain number of significant digits by omitting less significant digits.'];
  helpArgs: HelpArg[] = [
    { name: 'value', description: 'The number to truncate.', type: ['number'] },
    {
      name: 'places',
      description: 'The number of significant digits to keep. Defaults to 0.',
      type: ['number'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length < 1 || this.bareArgs.length > 2) {
      throw new FormulaError('#N/A', 'Number of arguments for TRUNC is incorrect.');
    }
    this.bareArgs[0] = ensureNumber(this.bareArgs[0]);
    this.bareArgs[1] = this.bareArgs[1] != null ? Math.floor(ensureNumber(this.bareArgs[1])) : 0;
  }

  protected main(value: number, places: number) {
    const factor = Math.pow(10, places);
    return (value >= 0 ? Math.floor : Math.ceil)(value * factor) / factor;
  }
}
