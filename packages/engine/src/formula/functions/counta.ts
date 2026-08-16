import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { eachMatrix } from './__utils';

const description = `Returns the number of values in the data set.`;

export class CountaFunction extends BaseFunction {
  example = 'COUNTA(A2:A100,B2:B100,4,26)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Values or ranges to count.',
      takesMatrix: true,
      acceptedTypes: ['number', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected main(...values: any[]) {
    let count = 0;
    values.forEach((val) => {
      eachMatrix(
        val,
        (v) => {
          if (v != null && v !== '') {
            count++;
          }
        },
        this.at,
      );
    });
    return count;
  }
}
