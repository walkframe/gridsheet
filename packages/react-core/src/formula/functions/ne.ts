import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ne } from './__utils';

const description = `Returns TRUE if the two specified values are not equal, FALSE if they are.
This is the same as the '<>' operator.`;

export class NeFunction extends BaseFunction {
  example = 'NE(6, 7)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'First value.', acceptedTypes: ['any'] },
    { name: 'value2', description: 'A value to be compared with value1.', acceptedTypes: ['any'] },
  ];
  category: FunctionCategory = 'logical';

  protected main(v1: number, v2: number) {
    return ne(v1, v2);
  }
}
