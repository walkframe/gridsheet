import { BaseFunction, type FunctionArgumentDefinition } from '@gridsheet/react-core';
import { ensureString, ensureNumber } from '@gridsheet/react-core';
import type { FunctionCategory } from '@gridsheet/react-core';

const description = `Replaces part of a text string with a different text string.
position is 1-based.`;

export class ReplaceFunction extends BaseFunction {
  example = 'REPLACE("Hello World", 7, 5, "Excel")';
  description = description;
  defs: FunctionArgumentDefinition[] = [
    { name: 'text', description: 'The original text string.', acceptedTypes: ['string'] },
    { name: 'position', description: 'The 1-based position at which to start replacing.', acceptedTypes: ['number'] },
    { name: 'length', description: 'The number of characters to replace.', acceptedTypes: ['number'] },
    { name: 'new_text', description: 'The replacement text.', acceptedTypes: ['string'] },
  ];
  category: FunctionCategory = 'text';

  protected validate(args: any[]): any[] {
    args = super.validate(args);
    args[0] = ensureString(args[0]);
    args[1] = ensureNumber(args[1]);
    args[2] = ensureNumber(args[2]);
    args[3] = ensureString(args[3]);
    return args;
  }

  protected main(text: string, position: number, length: number, newText: string) {
    // Convert to array of Unicode code points to handle surrogate pairs correctly
    const chars = [...text];
    const start = Math.max(0, position - 1);
    chars.splice(start, length, newText);
    return chars.join('');
  }
}
