import type { FunctionMapping, RegistryProps } from '@gridsheet/react-core';
import { useBook, createBook } from '@gridsheet/react-core';
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

/** useBook with all extended functions pre-loaded. User-supplied additionalFunctions are merged on top. */
export const useSpellbook = ({ additionalFunctions, ...rest }: RegistryProps = {}) =>
  useBook({ ...rest, additionalFunctions: { ...allFunctions, ...additionalFunctions } });

/** createBook with all extended functions pre-loaded. User-supplied additionalFunctions are merged on top. */
export const createSpellbook = ({ additionalFunctions, ...rest }: RegistryProps = {}) =>
  createBook({ ...rest, additionalFunctions: { ...allFunctions, ...additionalFunctions } });

export default allFunctions;
