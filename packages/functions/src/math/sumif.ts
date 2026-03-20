import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Sheet, eachMatrix, stripSheet, check, conditionArg, ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the sum of a series of cells.`;

export class SumifFunction extends BaseFunction {
  example = 'SUMIF(A1:A10,">20")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'range', description: 'A condition range.', takesMatrix: true, acceptedTypes: ['matrix'] },
    conditionArg,
    {
      name: 'sum_range',
      description: 'A range to be summarized.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'math';

  protected main(range: Sheet, condition: any, sumRange?: Sheet) {
    const conditionStr = ensureString(condition);
    const condArr: any[] = [];
    const sumArr: any[] = [];

    eachMatrix(
      range,
      (v) => {
        condArr.push(v);
      },
      this.at,
    );
    if (sumRange) {
      eachMatrix(
        sumRange,
        (v) => {
          sumArr.push(v);
        },
        this.at,
      );
    }

    let total = 0;
    condArr.forEach((c, i) => {
      const s = stripSheet({ value: (sumRange ? sumArr[i] : c) ?? 0 });
      if (typeof s === 'number' && check(c, conditionStr)) {
        total += s;
      }
    });
    return total;
  }
}
