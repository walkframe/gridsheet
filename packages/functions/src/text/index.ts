import type { FunctionMapping } from '@gridsheet/react-core';
import { ConcatenateFunction } from './concatenate';
import { LenbFunction } from './lenb';

export const textFunctions: FunctionMapping = {
  concatenate: ConcatenateFunction,
  lenb: LenbFunction,
};

export default textFunctions;
