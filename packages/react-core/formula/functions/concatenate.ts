import { BaseFunction } from './__base';
import { ensureString } from './__utils';

export class ConcatenateFunction extends BaseFunction {
  example = 'CONCATENATE("Hello", "World")';
  helpText = ['Returns the concatenation of the values.'];
  helpArgs = [
    { name: 'value1', description: 'First string value.' },
    {
      name: 'value2',
      description: 'Additional string values to be concatenated with the value1',
      optional: true,
      iterable: true,
    },
  ];

  protected validate() {
    this.bareArgs = this.bareArgs.map((arg) => ensureString(arg));
  }

  protected main(...values: string[]) {
    return values.reduce((a, b) => a + b);
  }
}
