import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureNumber, eachMatrix } from './__utils';

const description = `Returns the sum of a series of numbers or cells.`;

export class SumFunction extends BaseFunction {
  example = 'SUM(A2:A100, 101)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to sum.',
      takesMatrix: true,
      acceptedTypes: ['number', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected main(...values: any[]) {
    if (values.length === 0) {
      return 0;
    }
    let sum = 0;
    values.forEach((val) => {
      eachMatrix(
        val,
        (v) => {
          sum += ensureNumber(v, { ignore: true });
        },
        this.at,
      );
    });
    return sum;
  }
}
