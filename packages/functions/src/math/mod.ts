import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the result of the modulo operation.`;

export class ModFunction extends BaseFunction {
  example = 'MOD(10, 4)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'dividend',
      description: 'A number that will be divided by divisor.',
      acceptedTypes: ['number'],
    },
    { name: 'divisor', description: 'A number that will divide a dividend.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    if (args.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for MOD is incorrect.');
    }
    const validated = args.map((arg) => ensureNumber(arg));
    if (validated[1] === 0) {
      throw new FormulaError('#DIV/0!', 'The second argument must be non-zero.');
    }
    return validated;
  }

  protected main(v1: number, v2: number) {
    // https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
    return ((v1 % v2) + v2) % v2;
  }
}
