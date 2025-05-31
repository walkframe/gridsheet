import type { PointType } from '../types';
import type { Table } from './table';
import { Lexer } from '../formula/evaluator';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '../constants';


export const insertTextAtCursor = (input: HTMLTextAreaElement, text: string) => {
  input.focus();
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
}

export const insertRef = ({ input, ref, dryRun=false }: InsertRefProps): boolean => {
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
  return insertRef({input, ref: '', dryRun: true });
};

export const expandInput = (input: HTMLTextAreaElement | null) => {
  if (input == null) {
    return;
  }
  input.style.width = `${input.scrollWidth}px`;
  input.style.height = `${input.scrollHeight}px`;
};

export const resetInput = (input: HTMLTextAreaElement | null, table: Table, point: PointType) => {
  const style = input?.style;
  if (style == null) {
    return;
  }
  const width = table.getByPoint({ x: point.x, y: 0})?.width ?? DEFAULT_WIDTH;
  const height = table.getByPoint(point)?.height ?? DEFAULT_HEIGHT;
  style.width = `${width}px`;
  style.height = `${height}px`;
};
