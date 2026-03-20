import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { lt } from './__utils';

const description = `Returns TRUE if the first argument is truely less than the second argument, FALSE otherwise.
This is the same as the '<' operator.`;

export class LtFunction extends BaseFunction {
  example = 'LT(3, 6)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'First value.', acceptedTypes: ['any'] },
    { name: 'value2', description: 'A value to be compared with value1.', acceptedTypes: ['any'] },
  ];
  category: FunctionCategory = 'logical';

  protected main(v1: any, v2: any) {
    return lt(v1, v2);
  }
}
