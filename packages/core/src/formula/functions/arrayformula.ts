import { Sheet } from '../../lib/sheet';
import { Spilling } from '../../sentinels';
import { BaseFunction, FunctionCategory, FunctionArgumentDefinition } from './__base';

const description = `Enables the display of values returned from an array formula into multiple rows and/or columns.
If the argument is already a Spilling, it is returned as-is. If it is a Sheet (range reference), the field matrix is extracted and wrapped in a Spilling. Otherwise the value is wrapped as a single-element Spilling.`;

export class ArrayformulaFunction extends BaseFunction {
  autoSpilling = true;
  example = 'ARRAYFORMULA(A1:A10 * B1:B10)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The array expression or value to evaluate.',
      takesMatrix: true,
      acceptedTypes: ['matrix', 'any'],
    },
  ];
  category: FunctionCategory = 'logical';
  protected broadcastDisabled = true;

  protected main(value: any) {
    if (Spilling.is(value)) {
      return value;
    }
    if (value instanceof Sheet) {
      return value._toValueMatrix();
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [[value]];
  }
}
