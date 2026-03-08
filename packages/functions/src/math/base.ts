import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Converts a number into a text representation in another base, e.g. base 2 for binary.`;

export class BaseConvFunction extends BaseFunction {
  example = 'BASE(255, 16)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'A non-negative integer to convert.', acceptedTypes: ['number'] },
    { name: 'base', description: 'The base (radix) to convert into, between 2 and 36.', acceptedTypes: ['number'] },
    {
      name: 'min_length',
      description: 'Minimum length of the result string (zero-padded).',
      acceptedTypes: ['number'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    if (args.length < 2 || args.length > 3) {
      throw new FormulaError('#N/A', 'Number of arguments for BASE is incorrect.');
    }
    args[0] = Math.floor(ensureNumber(args[0]));
    args[1] = Math.floor(ensureNumber(args[1]));
    if (args[0] < 0) {
      throw new FormulaError('#NUM!', 'BASE requires a non-negative integer as value.');
    }
    if (args[1] < 2 || args[1] > 36) {
      throw new FormulaError('#NUM!', 'BASE requires a base between 2 and 36.');
    }
    if (args[2] != null) {
      args[2] = Math.floor(ensureNumber(args[2]));
      if (args[2] < 0) {
        throw new FormulaError('#NUM!', 'BASE min_length must be non-negative.');
      }
    }
    return args;
  }

  protected main(value: number, base: number, minLength?: number) {
    const result = value.toString(base).toUpperCase();
    if (minLength != null && result.length < minLength) {
      return result.padStart(minLength, '0');
    }
    return result;
  }
}
