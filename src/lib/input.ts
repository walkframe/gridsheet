import { Lexer, Token } from "../formula/evaluator";

export const insertTextAtCursor = (input: HTMLTextAreaElement, text: string) => {
  const selectPoint = input.selectionEnd;
  const before = input.value.slice(0, selectPoint);
  const after = input.value.slice(selectPoint);
  input.value = `${before}${text}${after}`;
  input.selectionEnd = before.length + text.length;
};

export const insertRef = (input: HTMLTextAreaElement | null, ref: string) => {
  if (!input?.value?.startsWith('=')) {
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
    // MEMO: There is concern that REF fixation may become a problem in the future (in that case, RANGE needs to be supported).
    const newToken = new Token("REF", ref);
    lexer.tokens[tokenIndex] = newToken;
    input.value = `=${lexer.stringify()}`;
    input.selectionEnd = lexer.getCharPositionByTokenIndex(tokenIndex + 1) + 1;
  } else {
    return false;
  }
  input.focus();
  return true;
}

export const expandInput = (input: HTMLTextAreaElement) => {
  input.style.width = `${input.scrollWidth}px`;
  input.style.height = `${input.scrollHeight}px`;
}