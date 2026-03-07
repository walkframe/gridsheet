import type { FunctionMapping } from '@gridsheet/react-core';
import { ConcatenateFunction } from './concatenate';
import { LenbFunction } from './lenb';

export const stringFunctions: FunctionMapping = {
  concatenate: ConcatenateFunction,
  lenb: LenbFunction,
};

export default stringFunctions;
