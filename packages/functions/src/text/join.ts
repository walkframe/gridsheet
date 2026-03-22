import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { stripMatrix, ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Joins the elements of one or more 1D arrays or values using a delimiter.
If the delimiter is omitted the result is similar to CONCATENATE.`;

export class JoinFunction extends BaseFunction {
  example = 'JOIN(", ", A1:A5)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'delimiter', description: 'The string to place between joined values.', acceptedTypes: ['string'] },
    {
      name: 'value_or_array',
      description: 'Values or arrays to join.',
      takesMatrix: true,
      acceptedTypes: ['any', 'matrix'],
      variadic: true,
    },
  ];
  category: FunctionCategory = 'text';

  protected validate(args: any[]): any[] {
    const validated = super.validate(args);
    for (let i = 1; i < validated.length; i++) {
      const matrix = this.toMatrix(validated[i]);
      if (matrix.length > 1 && matrix[0].length > 1) {
        throw new FormulaError('#VALUE!', 'JOIN requires each value_or_array argument to be a single row or column.');
      }
    }
    return validated;
  }

  protected main(delimiter: string, ...rest: any[]) {
    const parts: string[] = [];
    for (const arg of rest) {
      this.eachMatrix(arg, (v: any) => {
        parts.push(ensureString(stripMatrix(v, this.at)));
      });
    }
    return parts.join(delimiter);
  }
}
