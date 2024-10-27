import { Lexer } from '../formula/evaluator';

export const insertTextAtCursor = (input: HTMLTextAreaElement, text: string) => {
  const deprecated = !document.execCommand?.('insertText', false, text);
  if (!deprecated) {
    return input.value;
  }
  input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
  return input.value;
};

export const insertRef = (input: HTMLTextAreaElement | null, ref: string) => {
  if (!input?.value?.startsWith('=') || input.selectionStart === 0) {
    return null;
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
    insertTextAtCursor(input, ref);
  } else if (token.type === 'REF' || token.type === 'RANGE') {
    const [start, end] = lexer.getTokenPositionRange(tokenIndex + 1);
    input.focus();
    input.setSelectionRange(start + 1, end + 1);
    insertTextAtCursor(input, ref);
  } else {
    return '';
  }
  const event = new Event('input', { bubbles: true, composed: true });
  input.dispatchEvent(event);
  input.focus();
  return input.value;
};

export const isRefInsertable = (input: HTMLTextAreaElement | null) => {
  if (!input?.value?.startsWith('=') || input.selectionStart === 0) {
    return null;
  }
  const lexer = new Lexer(input.value.substring(1));
  lexer.tokenize();
  const tokenIndex = lexer.getTokenIndexByCharPosition(input.selectionStart - 1);
  let token = lexer.tokens[tokenIndex];
  if (token?.type === 'SPACE') {
    token = lexer.tokens[tokenIndex - 1];
  }
  return (
    token == null ||
    token.type === 'OPEN' ||
    token.type === 'COMMA' ||
    token.type === 'INFIX_OPERATOR' ||
    token.type === 'PREFIX_OPERATOR' ||
    token.type === 'REF' ||
    token.type === 'RANGE'
  );
};

export const expandInput = (input: HTMLTextAreaElement) => {
  input.style.width = `${input.scrollWidth}px`;
  input.style.height = `${input.scrollHeight}px`;
};
