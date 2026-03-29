import type { FunctionMapping } from '@gridsheet/core';
import { ConcatenateFunction } from './concatenate';
import { LenbFunction } from './lenb';
import { ExactFunction } from './exact';
import { UnicodeFunction } from './unicode';
import { ReplaceFunction } from './replace';
import { CleanFunction } from './clean';
import { CharFunction } from './char';
import { UnicharFunction } from './unichar';
import { ReptFunction } from './rept';
import { JoinFunction } from './join';
import { LowerFunction } from './lower';
import { UpperFunction } from './upper';
import { ProperFunction } from './proper';
import { TrimFunction } from './trim';

export const textFunctions: FunctionMapping = {
  concatenate: ConcatenateFunction,
  lenb: LenbFunction,
  exact: ExactFunction,
  unicode: UnicodeFunction,
  replace: ReplaceFunction,
  clean: CleanFunction,
  char: CharFunction,
  unichar: UnicharFunction,
  rept: ReptFunction,
  join: JoinFunction,
  lower: LowerFunction,
  upper: UpperFunction,
  proper: ProperFunction,
  trim: TrimFunction,
};

export default textFunctions;
