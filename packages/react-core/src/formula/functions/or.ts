import { BaseFunction, HelpArg } from './__base';
import { ensureBoolean } from './__utils';

export class OrFunction extends BaseFunction {
  example = 'OR(A1=1, A2=2)';
  helpText = ['Returns TRUE if any argument is logically true.', 'Returns FALSE if all arguments are logically false.'];
  helpArgs: HelpArg[] = [
    { name: 'expression1', description: 'First logical expression.', type: ['boolean'] },
    {
      name: 'expression2',
      description: 'Additional expressions',
      type: ['boolean'],
      optional: true,
      iterable: true,
    },
  ];

  protected validate() {
    this.bareArgs = this.bareArgs.map((arg) => ensureBoolean(arg));
  }

  protected main(...values: boolean[]) {
    return values.reduce((a, b) => a || b);
  }
}
