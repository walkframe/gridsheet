import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class SinFunction extends BaseFunction {
  example = 'SIN(PI()/2)';
  helpText = ['Returns the sin of the angle specified in radians.'];
  helpArgs: HelpArg[] = [
    {
      name: 'angle',
      description: 'An angle in radians, at which you want the sin.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for SIN is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(angle: number) {
    return Math.sin(angle);
  }
}
