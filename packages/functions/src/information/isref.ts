import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/web';
import { Sheet } from '@gridsheet/web';
import type { FunctionCategory } from '@gridsheet/web';

const description = `Returns TRUE if the value is a valid cell reference.`;

export class IsrefFunction extends BaseFunction {
  example = 'ISREF(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to check for being a cell reference.',
      acceptedTypes: ['any'],
      takesMatrix: true,
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(value: any) {
    return Sheet.is(value);
  }
}
