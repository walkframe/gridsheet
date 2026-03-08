import { BaseFunction, FormulaError } from '@gridsheet/react-core';
import { type FunctionProps, type HelpArg } from '@gridsheet/react-core';
import { stripTable } from '@gridsheet/react-core';
import { ensureBoolean } from '@gridsheet/react-core';

export class IfsFunction extends BaseFunction {
  example = 'IFS(A1>90, "A", A1>70, "B", A1>50, "C")';
  helpText = [
    'Evaluates multiple conditions and returns the value corresponding to the first TRUE condition.',
    'Arguments must be supplied in (condition, value) pairs.',
  ];
  helpArgs: HelpArg[] = [
    { name: 'condition1', description: 'First condition to evaluate.', type: ['boolean'] },
    { name: 'value1', description: 'Value to return if condition1 is TRUE.', type: ['any'] },
    {
      name: 'condition2',
      description: 'Additional conditions.',
      type: ['boolean'],
      optional: true,
      iterable: true,
    },
    {
      name: 'value2',
      description: 'Additional values.',
      type: ['any'],
      optional: true,
      iterable: true,
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

      const condRaw = condExpr.evaluate({ table: this.table });
      const cond = ensureBoolean(stripTable({ value: condRaw }));

      if (cond) {
        return stripTable({ value: valExpr.evaluate({ table: this.table }) });
      }
    }

    throw new FormulaError('#N/A', 'No condition in IFS was met.');
  }
}
