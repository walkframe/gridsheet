import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Returns the current date as a Date value.`;

export class TodayFunction extends BaseFunction {
  example = 'TODAY()';
  description = description;
  defs: FunctionArgumentDefinition[] = [];
  category: FunctionCategory = 'time';

  protected main() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
