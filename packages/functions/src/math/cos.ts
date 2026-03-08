import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class CosFunction extends BaseFunction {
  example = 'COS(PI())';
  helpText = ['Returns the cos of the angle specified in radians.'];
  helpArgs: HelpArg[] = [
    {
      name: 'angle',
      description: 'An angle in radians, at which you want the cos.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for COS is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(angle: number) {
    return Math.cos(angle);
  }
}
