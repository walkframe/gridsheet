import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/core';
import type { FunctionCategory } from '@gridsheet/core';

const description = `Tests whether two strings are exactly the same (case-sensitive). Returns TRUE or FALSE.`;

export class ExactFunction extends BaseFunction {
  example = 'EXACT("山", A3)';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'text1', description: 'First string to compare.', acceptedTypes: ['string', 'number', 'boolean'] },
    { name: 'text2', description: 'Second string to compare.', acceptedTypes: ['string', 'number', 'boolean'] },
  ];
  category: FunctionCategory = 'text';

  protected main(text1: any, text2: any) {
    return String(text1) === String(text2);
  }
}
