import { BaseFunction, FormulaError } from '@gridsheet/react-core';
import { type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureBoolean } from '@gridsheet/react-core';

const description = `Evaluates multiple conditions and returns the value corresponding to the first TRUE condition.
Arguments must be supplied in (condition, value) pairs.`;

export class IfsFunction extends BaseFunction {
  example = 'IFS(A1>90, "A", A1>70, "B", A1>50, "C")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'condition', description: 'Condition to evaluate.', acceptedTypes: ['boolean'], variadic: true },
    { name: 'value', description: 'Value to return if condition is TRUE.', acceptedTypes: ['any'], variadic: true },
  ];
  category = 'logical' as const;

  protected validate(args: any[]): any[] {
    if (args.length < 2) {
      throw new FormulaError('#N/A', 'IFS requires at least one condition-value pair.');
    }
    if (args.length % 2 !== 0) {
      throw new FormulaError('#N/A', 'IFS requires an even number of arguments (condition, value) pairs.');
    }
    for (let i = 0; i < args.length; i += 2) {
      if (ensureBoolean(args[i])) {
        return [args[i + 1]];
      }
    }
    throw new FormulaError('#N/A', 'No condition in IFS was met.');
  }

  protected main(result: any) {
    return result;
  }
}
