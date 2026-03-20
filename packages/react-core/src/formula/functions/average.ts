import { FormulaError } from '../formula-error';
import { BaseFunction, FunctionCategory, FunctionArgumentDefinition, isMatrix } from './__base';
import { ensureNumber, eachMatrix } from './__utils';

const description = `Returns the average of a series of numbers or cells.`;

export class AverageFunction extends BaseFunction {
  example = 'AVERAGE(A2:A100, 101)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'Numbers or ranges to average.',
      takesMatrix: true,
      acceptedTypes: ['number', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'statistics';

  protected main(...values: any[]) {
    let sum = 0;
    let count = 0;
    values.forEach((val) => {
      if (isMatrix(val)) {
        eachMatrix(
          val,
          (v) => {
            if (typeof v === 'number') {
              sum += v;
              count++;
            }
          },
          this.at,
        );
      } else {
        const num = ensureNumber(val);
        sum += num;
        count++;
      }
    });

    if (count === 0) {
      throw new FormulaError('#DIV/0!', 'Evaluation of function AVERAGE caused a divide by zero error.');
    }
    return sum / count;
  }
}
