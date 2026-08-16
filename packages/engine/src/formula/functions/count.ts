import { BaseFunction, FunctionCategory, FunctionArgumentDefinition, isMatrix } from './__base';
import { ensureNumber, isNumeric, eachMatrix } from './__utils';

const description = `Returns the count of a series of numbers or cells.`;

export class CountFunction extends BaseFunction {
  example = 'COUNT(A2:A100,B2:B100,4,26)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to count.',
      takesMatrix: true,
      acceptedTypes: ['number', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected main(...values: any[]) {
    let count = 0;
    values.forEach((val) => {
      if (isMatrix(val)) {
        eachMatrix(
          val,
          (v) => {
            if (isNumeric(v)) {
              count++;
            }
          },
          this.at,
        );
      } else {
        ensureNumber(val);
        count++;
      }
    });
    return count;
  }
}
