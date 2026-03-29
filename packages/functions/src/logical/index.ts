import type { FunctionMapping } from '@gridsheet/core';
import { XorFunction } from './xor';
import { IfnaFunction } from './ifna';
import { IfsFunction } from './ifs';

export const logicalFunctions: FunctionMapping = {
  xor: XorFunction,
  ifna: IfnaFunction,
  ifs: IfsFunction,
};

export default logicalFunctions;
