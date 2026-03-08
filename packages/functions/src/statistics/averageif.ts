import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Table, eachMatrix, stripTable, check, conditionArg, ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the average of a series of cells that meet a condition.`;

export class AverageifFunction extends BaseFunction {
  example = 'AVERAGEIF(A1:A10,">20")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'range', description: 'A condition range.', takesMatrix: true, acceptedTypes: ['matrix'] },
    conditionArg,
    {
      name: 'average_range',
      description: 'A range to be averaged.',
      takesMatrix: true,
      acceptedTypes: ['matrix'],
      optional: true,
    },
  ];
  category: FunctionCategory = 'statistics';

  protected main(range: Table, condition: any, avgRange?: Table) {
    const conditionStr = ensureString(condition);
    const condArr: any[] = [];
    const avgArr: any[] = [];

    eachMatrix(
      range,
      (v) => {
        condArr.push(v);
      },
      this.at,
    );
    if (avgRange) {
      eachMatrix(
        avgRange,
        (v) => {
          avgArr.push(v);
        },
        this.at,
      );
    }

    let total = 0;
    let count = 0;
    condArr.forEach((c, i) => {
      const s = stripTable({ value: (avgRange ? avgArr[i] : c) ?? 0 });
      if (typeof s === 'number' && check(c, conditionStr)) {
        total += s;
        count++;
      }
    });

    if (count === 0) {
      throw new FormulaError('#DIV/0!', 'No cells match the condition.');
    }
    return total / count;
  }
}
