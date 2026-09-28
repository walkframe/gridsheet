/**
 * A1-notation helpers, dependency-free. Columns and rows are 1-based, matching
 * OOXML cell references (e.g. "A1" → { col: 1, row: 1 }).
 */

/** 1-based column index → column name. 1 → "A", 27 → "AA". */
export const colName = (col: number): string => {
  let name = '';
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
};

/** Column name → 1-based column index. "A" → 1, "AA" → 27. */
export const colIndex = (name: string): number => {
  let n = 0;
  for (let i = 0; i < name.length; i++) {
    n = n * 26 + (name.charCodeAt(i) - 64);
  }
  return n;
};

/** Parse an A1 reference into 1-based { row, col }. Absolute markers ($) are ignored. */
export const parseRef = (ref: string): { row: number; col: number } => {
  const m = /([A-Za-z]+)\$?(\d+)/.exec(ref.replace(/\$/g, ''));
  if (!m) {
    return { row: 1, col: 1 };
  }
  return { col: colIndex(m[1].toUpperCase()), row: parseInt(m[2], 10) };
};
