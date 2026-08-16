import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureString } from './__utils';

const description = `Returns the length of a string.`;

export class LenFunction extends BaseFunction {
  example = 'LEN(A2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'text',
      description: 'A text to be returned the length.',
      acceptedTypes: ['string', 'number'],
    },
  ];
  category: FunctionCategory = 'text';

  protected main(text: any) {
    return ensureString(text).length;
  }
}
