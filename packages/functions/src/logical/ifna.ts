import { BaseFunction, FormulaError } from '@gridsheet/react-core';
import { type FunctionProps, type HelpArg } from '@gridsheet/react-core';
import { stripTable } from '@gridsheet/react-core';

export class IfnaFunction extends BaseFunction {
  example = 'IFNA(A1, "N/A error occurred")';
  helpText = ['Returns the first argument if it is not a #N/A error, otherwise returns the second argument.'];
  helpArgs: HelpArg[] = [
    {
      name: 'value',
      description: 'The value to return if it is not a #N/A error.',
      type: ['any'],
    },
    {
      name: 'value_if_na',
      description: 'The value to return if the first argument is a #N/A error.',
      optional: true,
      type: ['any'],
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
    if (this.lazyArgs.length !== 1 && this.lazyArgs.length !== 2) {
      throw new FormulaError(
        '#N/A',
        'Number of arguments for IFNA is incorrect. 1 or 2 argument(s) must be specified.',
      );
    }

    const [value, valueIfNa] = this.lazyArgs;

    try {
      const result = value.evaluate({ table: this.table });
      const stripped = stripTable({ value: result });
      if (FormulaError.is(stripped) && (stripped as FormulaError).code === '#N/A') {
        return stripTable({ value: valueIfNa?.evaluate({ table: this.table }) });
      }
      return stripped;
    } catch (e) {
      if (e instanceof FormulaError && e.code === '#N/A') {
        return stripTable({ value: valueIfNa?.evaluate({ table: this.table }) });
      }
      throw e;
    }
  }
}
