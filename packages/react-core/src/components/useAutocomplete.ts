import { useState, useMemo, useCallback } from 'react';
import { getFunctionHelps, type FunctionHelp } from '../formula/mapping';
import type { FunctionMapping } from '../formula/functions/__base';
import type { AutocompleteOption } from '../policy/core';
import { Lexer } from '../formula/evaluator';

type UseAutocompleteProps = {
  inputting: string;
  selectionStart: number;
  optionsAll: AutocompleteOption[];
  functions?: FunctionMapping;
};

export const useAutocomplete = ({ inputting, selectionStart, optionsAll, functions }: UseAutocompleteProps) => {
  const [selected, setSelected] = useState(0);

  const { filteredOptions, matchParams, activeFunctionHelp, activeArgIndex } = useMemo(() => {
    const isFormula = inputting.startsWith('=');

    let activeFunctionHelp: FunctionHelp | null = null;
    let activeArgIndex: number = 0;

    const textBeforeCursor = inputting.slice(0, selectionStart);
    const textAfterCursor = inputting.slice(selectionStart);

    // --- Active Argument Context Tracking ---
    if (isFormula && textBeforeCursor.length > 1) {
      try {
        const textToCursor = textBeforeCursor.slice(1); // skip '='
        const lexer = new Lexer(textToCursor);
        lexer.tokenize();

        const functionStack: { name: string; argIndex: number; hasWaitComma: boolean }[] = [];

        for (let i = 0; i < lexer.tokens.length; i++) {
          const token = lexer.tokens[i];
          if (token.type === 'FUNCTION') {
            const nextToken = lexer.tokens[i + 1];
            if (nextToken?.type === 'OPEN') {
              functionStack.push({ name: token.entity as string, argIndex: 0, hasWaitComma: false });
              i++; // skip OPEN
            } else if (i === lexer.tokens.length - 1) {
              // Function keyword right before cursor but without paren yet!
              // Do nothing special here, autocomplete dropdown will handle it.
            }
          } else if (token.type === 'COMMA') {
            if (functionStack.length > 0) {
              functionStack[functionStack.length - 1].argIndex++;
              functionStack[functionStack.length - 1].hasWaitComma = true;
            }
          } else if (token.type === 'CLOSE') {
            if (functionStack.length > 0) {
              functionStack.pop();
            }
          } else if (token.type !== 'SPACE' && functionStack.length > 0) {
            functionStack[functionStack.length - 1].hasWaitComma = false;
          }
        }

        if (functionStack.length > 0) {
          const activeItem = functionStack[functionStack.length - 1];
          const helps = getFunctionHelps(functions);
          activeArgIndex = activeItem.argIndex;
          activeFunctionHelp = helps.find((h: any) => h.name === activeItem.name.toUpperCase()) || null;
        }
      } catch (e) {
        /* ignore parse errors */
      }
    }

    const wordBefore = textBeforeCursor.match(/[a-zA-Z0-9_]+$/)?.[0] || '';
    const wordAfter = textAfterCursor.match(/^[a-zA-Z0-9_]+/)?.[0] || '';

    // For regular cells, we use the whole word as the search target.
    // For formulas, we extract the word under the cursor.
    const currentWord = isFormula ? (wordBefore + wordAfter).toLowerCase() : inputting.toLocaleLowerCase();
    const hasOpenParenAssigned = isFormula && textAfterCursor.slice(wordAfter.length).trimStart().startsWith('(');

    let filtered: any[] = [];

    let isOnAddress = false;
    if (isFormula) {
      try {
        const fullLexer = new Lexer(inputting.slice(1));
        fullLexer.tokenize();
        let currentIndex = 1; // start after '='
        for (const token of fullLexer.tokens) {
          const tLen = token.length();
          if (selectionStart > currentIndex && selectionStart < currentIndex + tLen) {
            if (['REF', 'RANGE', 'ID', 'ID_RANGE', 'UNREFERENCED'].includes(token.type)) {
              isOnAddress = true;
            }
            // Inside a string literal (VALUE token whose entity is a string)
            if (token.type === 'VALUE' && typeof token.entity === 'string') {
              isOnAddress = true;
            }
            break;
          }
          if (selectionStart === currentIndex || selectionStart === currentIndex + tLen) {
            if (['REF', 'RANGE', 'ID', 'ID_RANGE', 'UNREFERENCED'].includes(token.type)) {
              isOnAddress = true;
            }
          }
          currentIndex += tLen;
        }
      } catch (e) {
        /* ignore parse errors */
      }
    }

    if (isFormula && !isOnAddress) {
      // Suggest if we have at least 1 letter, and there isn't already an opening parenthesis attached
      if (currentWord.length > 0 && !hasOpenParenAssigned) {
        filtered = getFunctionHelps(functions)
          .map((help: any) => {
            const keywordLower = help.name.toLowerCase();
            const startsWith = keywordLower.startsWith(currentWord);
            const index = startsWith ? 0 : -1;
            const hasNoArgs = help.defs.length === 0;
            return {
              option: { ...help, value: help.name + (hasNoArgs ? '()' : '('), isFunction: true, label: help.name },
              index,
              startsWith,
              keywordCount: 1,
              keyword: keywordLower,
            };
          })
          .filter(({ startsWith }: { startsWith: boolean }) => startsWith)
          .sort((a: any, b: any) => {
            if (a.startsWith !== b.startsWith) {
              return b.startsWith ? 1 : -1;
            }
            if (a.index !== b.index) {
              return a.index - b.index;
            }
            return a.keyword.localeCompare(b.keyword);
          })
          .map(({ option }: { option: any }) => option);
      }
    } else {
      filtered = optionsAll
        .map((option) => {
          const keywords = option.keywords ?? [String(option.value)];
          let bestMatch = { index: -1, startsWith: false, keyword: '' };

          for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            const index = keywordLower.indexOf(currentWord);
            if (index !== -1) {
              const startsWith = keywordLower.startsWith(currentWord);
              if (
                bestMatch.index === -1 ||
                index < bestMatch.index ||
                (index === bestMatch.index && startsWith && !bestMatch.startsWith)
              ) {
                bestMatch = { index, startsWith, keyword };
              }
            }
          }

          return {
            option,
            ...bestMatch,
            keywordCount: keywords.length,
          };
        })
        .filter(({ index }) => index !== -1)
        .sort((a, b) => {
          if (a.startsWith !== b.startsWith) {
            return b.startsWith ? 1 : -1;
          }
          if (a.index !== b.index) {
            return a.index - b.index;
          }
          if (a.keywordCount !== b.keywordCount) {
            return b.keywordCount - a.keywordCount;
          }
          return a.keyword.localeCompare(b.keyword);
        })
        .map(({ option }) => option);
    }

    return {
      filteredOptions: filtered,
      matchParams: {
        isFormula,
        currentWord,
        matchLengthBefore: wordBefore.length,
        matchLengthAfter: wordAfter.length,
      },
      activeFunctionHelp,
      activeArgIndex,
    };
  }, [inputting, selectionStart, optionsAll, functions]);

  useMemo(() => {
    if (selected >= filteredOptions.length) {
      setSelected(0);
    }
  }, [filteredOptions.length, selected]);

  const replaceWithOption = useCallback(
    (option: any) => {
      if (!option) {
        return { value: inputting, selectionStart };
      }

      if (matchParams.isFormula) {
        const beforeMatch = inputting.slice(0, selectionStart - matchParams.matchLengthBefore);
        const afterMatch = inputting.slice(selectionStart + matchParams.matchLengthAfter);
        const newValue = beforeMatch + option.value + afterMatch;
        return { value: newValue, selectionStart: beforeMatch.length + option.value.length };
      } else {
        return { value: String(option.value), selectionStart: String(option.value).length };
      }
    },
    [inputting, selectionStart, matchParams],
  );

  const handleArrowUp = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (filteredOptions.length > 1) {
        setSelected((s) => (s <= 0 ? filteredOptions.length - 1 : s - 1));
        e.preventDefault();
        return true;
      }
      return false;
    },
    [filteredOptions.length],
  );

  const handleArrowDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (filteredOptions.length > 1) {
        setSelected((s) => (s >= filteredOptions.length - 1 ? 0 : s + 1));
        e.preventDefault();
        return true;
      }
      return false;
    },
    [filteredOptions.length],
  );

  return {
    filteredOptions,
    selected,
    setSelected,
    replaceWithOption,
    handleArrowUp,
    handleArrowDown,
    isFormula: matchParams.isFormula,
    activeFunctionHelp,
    activeArgIndex,
  };
};
