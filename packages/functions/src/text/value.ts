import { FormulaError } from '@gridsheet/react-core';
import { BaseFunction, type HelpArg } from '@gridsheet/react-core';
import { ensureString } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

// Excel serial date epoch: December 30, 1899
const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));
const MS_PER_DAY = 86400_000;

export class ValueFunction extends BaseFunction {
  example = 'VALUE("01/01/2012")';
  helpText = [
    'Converts a string representing a number, date, or time into a numeric value.',
    'Dates are converted to Excel serial numbers (1 = 1900-01-01).',
  ];
  helpArgs: HelpArg[] = [{ name: 'text', description: 'The string to convert to a number.', type: ['string'] }];
  category: FunctionCategory = 'text';

  protected validate() {
    if (this.bareArgs.length !== 1) {
      throw new FormulaError('#N/A', 'Number of arguments for VALUE is incorrect.');
    }
    this.bareArgs = [ensureString(this.bareArgs[0])];
  }

  protected main(text: string) {
    // Try plain numeric first
    const num = Number(text.replace(/,/g, ''));
    if (!isNaN(num)) {
      return num;
    }

    // Try percentage
    const pctMatch = text.match(/^([+-]?\d+(?:\.\d+)?)\s*%$/);
    if (pctMatch) {
      return parseFloat(pctMatch[1]) / 100;
    }

    // Try date/time
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
      const serial = (date.getTime() - EXCEL_EPOCH.getTime()) / MS_PER_DAY;
      return Math.round(serial * 1e9) / 1e9;
    }

    throw new FormulaError('#VALUE!', `VALUE: "${text}" cannot be converted to a number.`);
  }
}
