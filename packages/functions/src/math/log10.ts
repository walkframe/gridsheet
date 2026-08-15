import { FormulaError } from '@gridsheet/web';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

const description = `Returns the logarithm of 10`;

export class Log10Function extends BaseFunction {
  example = 'LOG10(100)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value for the logarithm of 10',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    if (value <= 0) {
      throw new FormulaError('NUM!', 'value must be greater than 0');
    }
    return Math.log10(value);
  }
}
