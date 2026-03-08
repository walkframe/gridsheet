import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

export class RadiansFunction extends BaseFunction {
  example = 'RADIANS(180)';
  helpText = ['Converts an angle value in degrees to radians.'];
  helpArgs: HelpArg[] = [
    {
      name: 'angle',
      description: 'An angle in degrees that you want to convert to radians.',
      type: ['number'],
    },
  ];
  category: FunctionCategory = 'math';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for RADIANS is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(angle: number) {
    return (angle / 180) * Math.PI;
  }
}
