import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class BaseConvFunction extends BaseFunction {
  example = 'BASE(255, 16)';
  helpText = ['Converts a number into a text representation in another base, e.g. base 2 for binary.'];
  helpArgs: HelpArg[] = [
    { name: 'value', description: 'A non-negative integer to convert.', type: ['number'] },
    { name: 'base', description: 'The base (radix) to convert into, between 2 and 36.', type: ['number'] },
    {
      name: 'min_length',
      description: 'Minimum length of the result string (zero-padded).',
      type: ['number'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length < 2 || this.bareArgs.length > 3) {
      throw new FormulaError('#N/A', 'Number of arguments for BASE is incorrect.');
    }
    this.bareArgs[0] = Math.floor(ensureNumber(this.bareArgs[0]));
    this.bareArgs[1] = Math.floor(ensureNumber(this.bareArgs[1]));
    if (this.bareArgs[0] < 0) {
      throw new FormulaError('#NUM!', 'BASE requires a non-negative integer as value.');
    }
    if (this.bareArgs[1] < 2 || this.bareArgs[1] > 36) {
      throw new FormulaError('#NUM!', 'BASE requires a base between 2 and 36.');
    }
    if (this.bareArgs[2] != null) {
      this.bareArgs[2] = Math.floor(ensureNumber(this.bareArgs[2]));
      if (this.bareArgs[2] < 0) {
        throw new FormulaError('#NUM!', 'BASE min_length must be non-negative.');
      }
    }
  }

  protected main(value: number, base: number, minLength?: number) {
    const result = value.toString(base).toUpperCase();
    if (minLength != null && result.length < minLength) {
      return result.padStart(minLength, '0');
    }
    return result;
  }
}
