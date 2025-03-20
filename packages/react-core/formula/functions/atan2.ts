import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class Atan2Function extends BaseFunction {
  example = 'ATAN2(4,3)';
  helpText = [
    'Returns the angle in radians between the x-axis and a line passing from the origin through a given coordinate point (x, y).',
  ];
  helpArgs = [
    {
      name: 'x',
      description: 'x of the point.',
    },
    {
      name: 'y',
      description: 'y of the point.',
    },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError('#N/A', 'Number of arguments for ATAN2 is incorrect.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(x: number, y: number) {
    return Math.atan2(x, y);
  }
}
