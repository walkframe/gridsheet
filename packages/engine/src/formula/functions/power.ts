import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureNumber } from './__utils';

const description = `Returns a number multiplied by an exponent.`;

export class PowerFunction extends BaseFunction {
  example = 'POWER(4,0.5)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'base', description: 'A number to be multiplied by an exponent.', acceptedTypes: ['number'] },
    { name: 'exponent', description: 'An exponent to power the base.', acceptedTypes: ['number'] },
  ];
  category: FunctionCategory = 'math';

  protected main(base: any, exponent: any) {
    return Math.pow(ensureNumber(base), ensureNumber(exponent));
  }
}
