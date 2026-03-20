import type { FunctionMapping } from '@gridsheet/react-core';
import { mathFunctions } from './math';
import { statisticsFunctions } from './statistics';
import { textFunctions } from './text';
import { lookupFunctions } from './lookup';
import { timeFunctions } from './time';
import { logicalFunctions } from './logical';
import { informationFunctions } from './information';

/** All extended functions combined into a single FunctionMapping. */
export const allFunctions: FunctionMapping = {
  ...mathFunctions,
  ...statisticsFunctions,
  ...textFunctions,
  ...lookupFunctions,
  ...timeFunctions,
  ...logicalFunctions,
  ...informationFunctions,
};

export default allFunctions;
