import { FormulaError } from '../evaluator';
import { BaseFunction } from './__base';
import { ensureNumber } from './__utils';

export class UminusFunction extends BaseFunction {
  example = 'UMINUS(4)';
  helpText = ['Returns a number with positive and negative values reversed.'];
  helpArgs = [{ name: 'value1', description: 'A number that will be subtracted.' }];

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'A single numerical value is only required.');
    }
    this.bareArgs = this.bareArgs.map((arg) => ensureNumber(arg));
  }

  protected main(v1: number) {
    return -v1;
  }
}
