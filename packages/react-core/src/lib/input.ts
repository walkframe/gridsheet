import type { PointType } from '../types';
import type { Sheet } from './sheet';
import { Lexer, splitRef } from '../formula/evaluator';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../constants';
import { a2p, grantAddressAbsolute } from './coords';
import { getSheetPrefix } from './sheet';
import { focus } from './dom';

export const insertTextAtCursor = (input: HTMLTextAreaElement, text: string) => {
  focus(input);
  const deprecated = !document.execCommand?.('insertText', false, text);
  if (!deprecated) {
    return;
  }
  input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
  return;
};

type InsertRefProps = {
  input: HTMLTextAreaElement | null;
  ref: string;
  dryRun?: boolean;
};

export const insertRef = ({ input, ref, dryRun = false }: InsertRefProps): boolean => {
  // dryRun is used to check if the ref can be inserted without actually inserting it
  if (!input?.value?.startsWith('=') || input.selectionStart === 0) {
    return false;
  }
  const lexer = new Lexer(input.value.substring(1));
  lexer.tokenize();
  const [tokenIndex, _] = lexer.getTokenIndexByCharPosition(input.selectionStart - 1);
  let token = lexer.tokens[tokenIndex];
  if (token?.type === 'SPACE') {
    token = lexer.tokens[tokenIndex - 1];
  }
  if (
    token == null ||
    token.type === 'OPEN' ||
    token.type === 'COMMA' ||
    token.type === 'INFIX_OPERATOR' ||
    token.type === 'PREFIX_OPERATOR'
  ) {
    if (!dryRun) {
      insertTextAtCursor(input, ref);
    }
  } else if (token.type === 'REF' || token.type === 'RANGE') {
    if (!dryRun) {
      // keep the absolute/relative state of the token
      const { sheetName: refSheetName, addresses: refAddresses } = splitRef(ref);
      const { addresses: tokenAddresses } = splitRef(token.entity as string);

      const tokenAbsolutes = tokenAddresses.map((a) => a2p(a));
      if (tokenAddresses.length === 2 && refAddresses.length === 1) {
        refAddresses.push(refAddresses[0]);
      }
      ref =
        getSheetPrefix(refSheetName) +
        refAddresses
          .map((r, i) => {
            return grantAddressAbsolute(r, !!tokenAbsolutes[i]?.absX, !!tokenAbsolutes[i]?.absY);
          })
          .join(':');

      const [start, end] = lexer.getTokenPositionRange(tokenIndex + 1, 1);
      input.setSelectionRange(start, end);
      insertTextAtCursor(input, ref);
    }
  } else {
    return false;
  }
  return true;
};

export const isRefInsertable = (input: HTMLTextAreaElement | null): boolean => {
  return insertRef({ input, ref: '', dryRun: true });
};

export const expandInput = (input: HTMLTextAreaElement | null) => {
  if (input == null) {
    return;
  }
  input.style.width = `${input.scrollWidth}px`;
  input.style.height = `${input.scrollHeight}px`;
};

export const resetInput = (input: HTMLTextAreaElement | null, sheet: Sheet, point: PointType) => {
  const style = input?.style;
  if (style == null) {
    return;
  }
  const width = sheet.getCellByPoint({ x: point.x, y: 0 }, 'SYSTEM')?.width ?? DEFAULT_WIDTH;
  const height = sheet.getCellByPoint(point, 'SYSTEM')?.height ?? DEFAULT_HEIGHT;
  style.width = `${width}px`;
  style.height = `${height}px`;
};

export const isFocus = (input: HTMLTextAreaElement | null): boolean => {
  if (typeof window === 'undefined' || input == null) {
    return false;
  }
  return document.activeElement === input;
};

/**
 * Handles auto-close behavior for double quotes in formula editing.
 * - Typing `"` inserts `""` and places cursor between them.
 * - Typing `"` when cursor is right before an auto-closed `"` skips over it.
 * - Backspace between empty `""` deletes both quotes.
 *
 * Returns true if the event was handled (caller should preventDefault), false otherwise.
 */
export const handleFormulaQuoteAutoClose = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  inputting: string,
): boolean => {
  const input = e.currentTarget;
  const isFormula = inputting.startsWith('=');
  if (!isFormula) {
    return false;
  }

  const { selectionStart, selectionEnd } = input;

  if (e.key === '"') {
    // If text is selected, wrap it in quotes
    if (selectionStart !== selectionEnd) {
      e.preventDefault();
      const selectedText = inputting.slice(selectionStart, selectionEnd);
      insertTextAtCursor(input, `"${selectedText}"`);
      requestAnimationFrame(() => {
        input.setSelectionRange(selectionStart + 1, selectionEnd + 1);
      });
      return true;
    }

    const charAfter = inputting[selectionStart];

    // Count unescaped double quotes before cursor (after '=') to determine if we're inside a string
    const beforeCursor = inputting.slice(1, selectionStart); // skip '='
    let quoteCount = 0;
    for (let i = 0; i < beforeCursor.length; i++) {
      if (beforeCursor[i] === '"') {
        // Skip escaped double quotes ("") inside strings
        if (i + 1 < beforeCursor.length && beforeCursor[i + 1] === '"') {
          i++; // skip the next quote
        } else {
          quoteCount++;
        }
      }
    }

    // If odd number of quotes before cursor, we're inside a string.
    // If the next char is `"`, it's the closing quote — skip over it.
    if (quoteCount % 2 === 1 && charAfter === '"') {
      e.preventDefault();
      input.setSelectionRange(selectionStart + 1, selectionStart + 1);
      return true;
    }

    // Otherwise, insert `""` and place cursor in between
    e.preventDefault();
    insertTextAtCursor(input, '""');
    requestAnimationFrame(() => {
      input.setSelectionRange(selectionStart + 1, selectionStart + 1);
    });
    return true;
  }

  if (e.key === 'Backspace') {
    // If cursor is between `""`, delete both
    if (
      selectionStart === selectionEnd &&
      selectionStart > 0 &&
      inputting[selectionStart - 1] === '"' &&
      inputting[selectionStart] === '"'
    ) {
      e.preventDefault();
      input.setRangeText('', selectionStart - 1, selectionStart + 1, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
  }

  return false;
};
