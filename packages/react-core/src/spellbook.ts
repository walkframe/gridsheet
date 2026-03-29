import { allFunctions } from '@gridsheet/functions';
import type { RegistryProps } from '@gridsheet/core';
import { createBook } from '@gridsheet/core';
import { useBook } from './lib/hooks';

/** useBook with all extended functions pre-loaded. User-supplied additionalFunctions are merged on top. */
export const useSpellbook = ({ additionalFunctions, ...rest }: RegistryProps = {}) =>
  useBook({ ...rest, additionalFunctions: { ...allFunctions, ...additionalFunctions } });

/** createBook with all extended functions pre-loaded. User-supplied additionalFunctions are merged on top. */
export const createSpellbook = ({ additionalFunctions, ...rest }: RegistryProps = {}) =>
  createBook({ ...rest, additionalFunctions: { ...allFunctions, ...additionalFunctions } });
