// DO NOT COPY THIS CODE FOR THE OTHER.
import { FormulaError } from '../formula-error';
import {
  FunctionArgumentDefinition,
  BaseFunction,
  FunctionCategory,
  isMatrix,
  isMultiCell,
  stripMatrix,
} from './__base';

const description = `Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.`;

export class IfErrorFunction extends BaseFunction {
  example = 'IFERROR(A1, "Error in cell A1")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'value',
      description: 'The value to return if value itself is not an error.',
      acceptedTypes: ['any'],
      errorTolerant: true,
    },
    {
      name: 'value_if_error',
      description: 'The value the function returns if value is an error.',
      optional: true,
      acceptedTypes: ['any'],
    },
  ];
  category: FunctionCategory = 'logical';
  protected broadcastDisabled = true;

  protected main(value: any, valueIfError?: any) {
    if (FormulaError.is(value) || value instanceof Error) {
      return valueIfError;
    }
    return value;
  }
}
