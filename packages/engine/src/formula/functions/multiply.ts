import { FormulaError } from '../formula-error';
import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureNumber } from './__utils';

const description = `Returns the product of two numbers.
This is the same as the '*' operator.`;

export class MultiplyFunction extends BaseFunction {
  example = 'MULTIPLY(6, 7)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'factor1', description: 'First factor.', acceptedTypes: ['number'] },
    { name: 'factor2', description: 'Second factor.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(v1: any, v2: any) {
    return ensureNumber(v1) * ensureNumber(v2);
  }
}
