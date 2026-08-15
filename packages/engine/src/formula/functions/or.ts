import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureBoolean } from './__utils';

const description = `Returns TRUE if any argument is logically true.
Returns FALSE if all arguments are logically false.`;

export class OrFunction extends BaseFunction {
  example = 'OR(A1=1, A2=2)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'expression',
      description: 'Logical expressions to evaluate.',
      acceptedTypes: ['boolean', 'number'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'logical';

  protected main(...values: any[]) {
    return values.map((v) => ensureBoolean(v)).reduce((a, b) => a || b);
  }
}
