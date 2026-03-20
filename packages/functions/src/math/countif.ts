import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Sheet, eachMatrix, ensureString, check, conditionArg } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns the count of a series of cells.`;

export class CountifFunction extends BaseFunction {
  example = 'COUNTIF(A1:A10,">20")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'range', description: 'Target range.', takesMatrix: true, acceptedTypes: ['matrix'] },
    { ...conditionArg },
  ];
  category: FunctionCategory = 'math';

  protected main(sheet: Sheet, condition: any) {
    const conditionStr = ensureString(condition);
    let count = 0;
    eachMatrix(
      sheet,
      (v: any) => {
        if (check(v, conditionStr)) {
          count++;
        }
      },
      this.at,
    );
    return count;
  }
}
