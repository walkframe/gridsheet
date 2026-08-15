import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

const description = `Returns TRUE if the referenced cell is empty.`;

export class IsblankFunction extends BaseFunction {
  example = 'ISBLANK(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'A reference to a cell to check for emptiness.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    return value === null || value === undefined || value === '';
  }
}
