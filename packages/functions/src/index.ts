import type { FunctionMapping, RegistryProps } from '@gridsheet/core';
import { createBook } from '@gridsheet/core';
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

/** createBook with all extended functions pre-loaded. User-supplied additionalFunctions are merged on top. */
export const createSpellbook = ({ additionalFunctions, ...rest }: RegistryProps = {}) =>
  createBook({ ...rest, additionalFunctions: { ...allFunctions, ...additionalFunctions } });

export default allFunctions;
