import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';
import { ensureBoolean } from './__utils';

const description = `Returns TRUE if all arguments are logically TRUE.
Returns FALSE if any argument is logically FALSE.`;

export class AndFunction extends BaseFunction {
  example = 'AND(A1=1, A2=2)';
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
    return values.map((v) => ensureBoolean(v)).reduce((a, b) => a && b);
  }
}
