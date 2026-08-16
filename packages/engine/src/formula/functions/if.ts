import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureBoolean } from './__utils';

const description = `If the logical expression is TRUE, the second argument is returned.
If FALSE, the third argument is returned.`;

export class IfFunction extends BaseFunction {
  example = 'IF(A2 = "Human", "Hello", "World")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'condition', description: 'An expression as a condition', acceptedTypes: ['any'] },
    {
      name: 'value1',
      description: 'value to be returned if the condition is true.',
      acceptedTypes: ['any'],
    },
    {
      name: 'value2',
      description: 'value to be returned if the condition is false.',
      optional: true,
      acceptedTypes: ['any'],
    },
  ];
  category: FunctionCategory = 'logical';

  protected main(condition: any, v1: any, v2: any = false) {
    return ensureBoolean(condition) ? v1 : v2;
  }
}
