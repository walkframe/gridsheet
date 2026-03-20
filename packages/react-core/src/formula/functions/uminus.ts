import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureNumber } from './__utils';

const description = `Returns a number with positive and negative values reversed.`;

export class UminusFunction extends BaseFunction {
  example = 'UMINUS(4)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'A number that will be subtracted.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(v1: any) {
    return -ensureNumber(v1);
  }
}
