import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the power of a number whose base is the Euler number e.`;

export class ExpFunction extends BaseFunction {
  example = 'EXP(2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'exponent',
      description: 'It is an exponent of power with e as the base.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    if (args.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for EXP is incorrect.');
    }
    return [ensureNumber(args[0])];
  }

  protected main(exponent: number) {
    return Math.exp(exponent);
  }
}
