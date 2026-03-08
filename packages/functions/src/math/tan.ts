import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class TanFunction extends BaseFunction {
  example = 'TAN(PI()/4)';
  helpText = ['Returns the tan of the angle specified in radians.'];
  helpArgs: HelpArg[] = [
    {
      name: 'angle',
      description: 'An angle in radians, at which you want the tan.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for TAN is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(angle: number) {
    return Math.tan(angle);
  }
}
