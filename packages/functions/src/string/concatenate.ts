import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';

export class ConcatenateFunction extends BaseFunction {
  example = 'CONCATENATE("Hello", "World")';
  helpText = ['Returns the concatenation of the values.'];
  helpArgs: HelpArg[] = [
    { name: 'value1', description: 'First string value.', type: ['string'] },
    {
      name: 'value2',
      description: 'Additional string values to be concatenated with the value1',
      optional: true,
      iterable: true,
      type: ['string'],
    },
  ];

  protected validate() {
    this.bareArgs = this.bareArgs.map((arg) => ensureString(arg));
  }

  protected main(...values: string[]) {
    return values.reduce((a, b) => a + b);
  }
}
