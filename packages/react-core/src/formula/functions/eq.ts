import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { eq } from './__utils';

const description = `Returns TRUE if the two specified values are equal, FALSE if they are not.
This is the same as the '=' operator.`;

export class EqFunction extends BaseFunction {
  example = 'EQ(6, 7)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'First value.', acceptedTypes: ['any'] },
    { name: 'value2', description: 'A value to be compared with value1.', acceptedTypes: ['any'] },
  ];
  category: FunctionCategory = 'logical';

  protected main(v1: any, v2: any) {
    return eq(v1, v2);
  }
}
