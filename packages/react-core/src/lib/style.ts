import type { CSSProperties } from 'react';

type BorderStyleValue = string;

interface BorderOptions {
  all?: BorderStyleValue;
  top?: BorderStyleValue;
  right?: BorderStyleValue;
  bottom?: BorderStyleValue;
  left?: BorderStyleValue;
}

export function makeBorder(options: BorderOptions): CSSProperties {
  const result: CSSProperties = {};
  const all = options.all;
  if (options.top ?? all) {
    result.borderTop = options.top ?? all;
  }
  if (options.right ?? all) {
    result.borderRight = options.right ?? all;
  }
  if (options.bottom ?? all) {
    result.borderBottom = options.bottom ?? all;
  }
  if (options.left ?? all) {
    result.borderLeft = options.left ?? all;
  }
  return result;
}
