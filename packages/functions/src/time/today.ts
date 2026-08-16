import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/engine';
import type { FunctionCategory } from '@gridsheet/engine';

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
