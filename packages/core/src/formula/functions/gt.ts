import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { gt } from './__utils';

const description = `Returns TRUE if the first argument is truly greater than the second, FALSE otherwise.
This is the same as the '>' operator.`;

export class GtFunction extends BaseFunction {
  example = 'GT(5, 3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'First value.', acceptedTypes: ['any'] },
    { name: 'value2', description: 'A value to be compared with value1.', acceptedTypes: ['any'] },
  ];
  category: FunctionCategory = 'logical';

  protected main(v1: any, v2: any) {
    return gt(v1, v2);
  }
}
