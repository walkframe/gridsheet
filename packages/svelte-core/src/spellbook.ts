import { allFunctions } from '@gridsheet/functions';
import type { RegistryProps } from '@gridsheet/preact-core';
import { useBook } from './book';

export { createSpellbook } from '@gridsheet/preact-core/spellbook';

/** useBook with all extended functions pre-loaded (Svelte version). */
export const useSpellbook = ({ additionalFunctions, ...rest }: RegistryProps = {}) =>
  useBook({ ...rest, additionalFunctions: { ...allFunctions, ...additionalFunctions } });
