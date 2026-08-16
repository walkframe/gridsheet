import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureNumber } from './__utils';

const description = `Returns the absolute value of a number`;

export class AbsFunction extends BaseFunction {
  example = 'ABS(-2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [{ name: 'value', description: 'target number', acceptedTypes: ['number'] }];
  category: FunctionCategory = 'math';

  protected main(value: any) {
    return Math.abs(ensureNumber(value));
  }
}
