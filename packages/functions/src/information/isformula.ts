import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { Sheet } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Returns TRUE if the referenced cell contains a formula.`;

export class IsformulaFunction extends BaseFunction {
  example = 'ISFORMULA(A1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'reference',
      description: 'The cell reference to check for a formula.',
      acceptedTypes: ['reference'],
      takesMatrix: true,
      errorTolerant: true,
    },
  ];
  category: FunctionCategory = 'information';

  protected main(ref: Sheet) {
    const cell = ref.getCell({ y: ref.top, x: ref.left }, { resolution: 'SYSTEM' });
    const raw = cell?.value;
    return typeof raw === 'string' && raw.startsWith('=');
  }
}
