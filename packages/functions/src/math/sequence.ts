import { FormulaError } from '@gridsheet/core';
import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import { ensureNumber } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Generates a sequence of numbers in a 2D array.
Returns a rows × cols array starting at start, incrementing by step.`;

export class SequenceFunction extends BaseFunction {
  autoSpilling = true;
  example = 'SEQUENCE(4, 3, 1, 1)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    {
      name: 'rows',
      description: 'The number of rows to return.',
      acceptedTypes: ['number'],
    },
    {
      name: 'columns',
      description: 'The number of columns to return. Defaults to 1.',
      optional: true,
      acceptedTypes: ['number'],
    },
    {
      name: 'start',
      description: 'The starting value of the sequence. Defaults to 1.',
      optional: true,
      acceptedTypes: ['number'],
    },
    {
      name: 'step',
      description: 'The increment between each value. Defaults to 1.',
      optional: true,
      acceptedTypes: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate(args: any[]): any[] {
    if (args.length < 1 || args.length > 4) {
      throw new FormulaError('#N/A', 'Number of arguments for SEQUENCE is incorrect.');
    }
    args[0] = Math.floor(ensureNumber(args[0]));
    if (args[0] < 1) {
      throw new FormulaError('#VALUE!', 'rows must be at least 1.');
    }
    if (args.length >= 2) {
      args[1] = Math.floor(ensureNumber(args[1]));
      if (args[1] < 1) {
        throw new FormulaError('#VALUE!', 'columns must be at least 1.');
      }
    }
    if (args.length >= 3) {
      args[2] = ensureNumber(args[2]);
    }
    if (args.length >= 4) {
      args[3] = ensureNumber(args[3]);
    }
    return args;
  }

  protected main(rows: number, cols: number = 1, start: number = 1, step: number = 1) {
    const matrix: number[][] = [];
    let current = start;
    for (let y = 0; y < rows; y++) {
      const row: number[] = [];
      for (let x = 0; x < cols; x++) {
        row.push(current);
        current += step;
      }
      matrix.push(row);
    }
    return matrix;
  }
}
