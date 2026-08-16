import { BaseFunction, FunctionCategory, FunctionArgumentDefinition, isMatrix } from './__base';
import { ensureNumber, isNumeric, eachMatrix } from './__utils';

const description = `Returns the max in a series of numbers or cells.`;

export class MaxFunction extends BaseFunction {
  example = 'MAX(A2:A100, 101)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to find max from.',
      acceptedTypes: ['number', 'matrix'],
      takesMatrix: true,
      variadic: true,
    },
  ];
  category: FunctionCategory = 'statistics';

  protected main(...values: any[]) {
    let max = -Infinity;
    let hasValues = false;
    values.forEach((val) => {
      if (isMatrix(val)) {
        eachMatrix(
          val,
          (v) => {
            if (isNumeric(v)) {
              const num = ensureNumber(v);
              if (num > max) {
                max = num;
              }
              hasValues = true;
            }
          },
          this.at,
        );
      } else {
        const num = ensureNumber(val);
        if (num > max) {
          max = num;
        }
        hasValues = true;
      }
    });
    return hasValues ? max : 0;
  }
}
