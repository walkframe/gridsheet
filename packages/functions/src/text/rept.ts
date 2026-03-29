import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { ensureString, ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Repeats text a specified number of times.`;

export class ReptFunction extends BaseFunction {
  example = 'REPT("ha", 3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'text', description: 'The text to repeat.', acceptedTypes: ['string'] },
    { name: 'number_of_times', description: 'The number of times to repeat the text.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'text';

  protected validate(args: any[]): any[] {
    args = super.validate(args);
    if (args[1] < 0) {
      throw new FormulaError('#VALUE!', 'Number of times must be non-negative.');
    }
    return args;
  }

  protected main(text: string, times: number) {
    text = ensureString(text);
    times = ensureNumber(times);
    return text.repeat(Math.trunc(times));
  }
}
