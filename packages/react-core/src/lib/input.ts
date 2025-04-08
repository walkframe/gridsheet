import { Lexer } from '../formula/evaluator';

export const insertTextAtCursor = (input: HTMLTextAreaElement, text: string) => {
  input.focus();
  const deprecated = !document.execCommand?.('insertText', false, text);
  if (!deprecated) {
    return;
  }
  input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
  return;
};

export const insertRef = (input: HTMLTextAreaElement | null, ref: string, dryRun = false): boolean => {
  // dryRun is used to check if the ref can be inserted without actually inserting it
  if (!input?.value?.startsWith('=') || input.selectionStart === 0) {
    return false;
  }
  const lexer = new Lexer(input.value.substring(1));
  lexer.tokenize();
  const tokenIndex = lexer.getTokenIndexByCharPosition(input.selectionStart - 1);
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
  return insertRef(input, '', true);
};

export const expandInput = (input: HTMLTextAreaElement) => {
  input.style.width = `${input.scrollWidth}px`;
  input.style.height = `${input.scrollHeight}px`;
};
