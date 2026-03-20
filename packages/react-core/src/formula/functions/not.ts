import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureBoolean } from './__utils';

const description = `Returns the inverse of the Boolean; if TRUE, NOT returns FALSE.
If FALSE, NOT returns TRUE.`;

export class NotFunction extends BaseFunction {
  example = 'NOT(TRUE)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'logical expression',
      description: 'A logical expression as a boolean.',
      acceptedTypes: ['boolean', 'number'],
    },
  ];
  category: FunctionCategory = 'logical';

  protected main(v1: any) {
    return !ensureBoolean(v1);
  }
}
