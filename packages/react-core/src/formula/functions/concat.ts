import { FormulaError } from '../formula-error';
import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureString } from './__utils';

const description = `Returns the concatenation of two values.
This is the same as the '&' operator.`;

export class ConcatFunction extends BaseFunction {
  example = 'CONCAT("Hello", "World")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value1',
      description: 'A value to be concatenated with value2.',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
    {
      name: 'value2',
      description: 'A value to be concatenated with value1',
      acceptedTypes: ['string', 'number', 'boolean'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(v1: any, v2: any) {
    return ensureString(v1) + ensureString(v2);
  }
}
