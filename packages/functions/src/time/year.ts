import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';
import { ensureDate } from './__utils';

const description = `Returns the year of a given date.`;

export class YearFunction extends BaseFunction {
  example = 'YEAR(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'date', description: 'The date from which to extract the year.', acceptedTypes: ['date', 'string'] },
  ];
  category: FunctionCategory = 'time';

  protected main(date: any) {
    return ensureDate(date).getFullYear();
  }
}
