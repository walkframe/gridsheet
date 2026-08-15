import { FormulaError } from '../formula-error';
import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureNumber } from './__utils';

const description = `Returns the result of dividing one number by another.
This is the same as the '/' operator.`;

export class DivideFunction extends BaseFunction {
  example = 'DIVIDE(4, 2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'dividend',
      description: 'A number that will be divided by divisor.',
      acceptedTypes: ['number'],
    },
    {
      name: 'divisor',
      description: 'A number that will divide a dividend. Must be non-zero.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    const validated = super.validate(args).map((arg) => ensureNumber(arg));
    if (validated[1] === 0) {
      throw new FormulaError('#DIV/0!', 'The second argument must be non-zero.');
    }
    return validated;
  }

  protected main(divided: number, divisor: number) {
    return divided / divisor;
  }
}
