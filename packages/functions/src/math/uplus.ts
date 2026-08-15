import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

const description = `Returns the number with its sign unchanged (unary plus).`;

export class UplusFunction extends BaseFunction {
  example = 'UPLUS(4)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A number to return as-is.',
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected main(value: number) {
    return value;
  }
}
