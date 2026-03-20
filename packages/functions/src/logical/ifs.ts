import { BaseFunction, FormulaError } from '@gridsheet/react-core';
import { type FunctionProps, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { stripSheet } from '@gridsheet/react-core';
import { ensureBoolean } from '@gridsheet/react-core';

const description = `Evaluates multiple conditions and returns the value corresponding to the first TRUE condition.
Arguments must be supplied in (condition, value) pairs.`;

export class IfsFunction extends BaseFunction {
  example = 'IFS(A1>90, "A", A1>70, "B", A1>50, "C")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'condition1', description: 'First condition to evaluate.', acceptedTypes: ['boolean'] },
    { name: 'value1', description: 'Value to return if condition1 is TRUE.', acceptedTypes: ['any'] },
    {
      name: 'condition2',
      description: 'Additional conditions.',
      acceptedTypes: ['boolean'],
      optional: true,
      variadic: true,
    },
    {
      name: 'value2',
      description: 'Additional values.',
      acceptedTypes: ['any'],
      optional: true,
      variadic: true,
    },
  ];
  category = 'logical' as const;

  // Store raw (unevaluated) expressions for lazy evaluation
  private lazyArgs: FunctionProps['args'];

  constructor(props: FunctionProps) {
    super(props);
    this.lazyArgs = props.args;
  }

  public call() {
    if (this.lazyArgs.length < 2) {
      throw new FormulaError('#N/A', 'IFS requires at least one condition-value pair.');
    }
    if (this.lazyArgs.length % 2 !== 0) {
      throw new FormulaError('#N/A', 'IFS requires an even number of arguments (condition, value) pairs.');
    }

    for (let i = 0; i < this.lazyArgs.length; i += 2) {
      const condExpr = this.lazyArgs[i];
      const valExpr = this.lazyArgs[i + 1];

      const condRaw = condExpr.evaluate({ sheet: this.sheet });
      const cond = ensureBoolean(stripSheet({ value: condRaw }));

      if (cond) {
        return stripSheet({ value: valExpr.evaluate({ sheet: this.sheet }) });
      }
    }

    throw new FormulaError('#N/A', 'No condition in IFS was met.');
  }
}
