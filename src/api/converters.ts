import { Address, MatrixType, Point, StoreType, X, Y } from "../types";
import { DEFAULT_ALPHABET_CACHE_SIZE } from "../constants";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const N2A_CACHE = new Map<number, string>();
const A2N_CACHE = new Map<string, number>();

export const n2a = (
  key: number,
  cacheSize = DEFAULT_ALPHABET_CACHE_SIZE
): string => {
  const cached = N2A_CACHE.get(--key);
  if (cached != null) {
    return cached;
  }
  if (key === 0) {
    return "";
  }
  let num = key;
  let result = "";
  do {
    result = ALPHABET[--num % 26] + result;
    num = Math.floor(num / 26);
  } while (num > 0);

  N2A_CACHE.set(key, result);
  const it = N2A_CACHE.keys();
  for (let st = it.next(); N2A_CACHE.size > cacheSize; st = it.next()) {
    N2A_CACHE.delete(st.value);
  }
  return result;
};

export const a2n = (
  key: string,
  cacheSize = DEFAULT_ALPHABET_CACHE_SIZE
): number => {
  const cached = A2N_CACHE.get(key);
  if (cached != null) {
    return cached;
  }
  if (key === "") {
    return 0;
  }
  let alpha = key;
  let result = 0;
  for (let digit = 0; digit < alpha.length; digit++) {
    const a = alpha[alpha.length - digit - 1];
    const num = ALPHABET.indexOf(a) + 1;
    result += ALPHABET.length ** digit * num;
  }
  A2N_CACHE.set(key, result);
  const it = A2N_CACHE.keys();
  for (let st = it.next(); A2N_CACHE.size > cacheSize; st = it.next()) {
    A2N_CACHE.delete(st.value);
  }
  return result;
};

export const x2c = (
  x: number,
  cacheSize = DEFAULT_ALPHABET_CACHE_SIZE
): string => {
  return n2a(x + 1, cacheSize);
};

export const c2x = (
  col: string,
  cacheSize = DEFAULT_ALPHABET_CACHE_SIZE
): number => {
  return a2n(col, cacheSize);
};

export const y2r = (y: number) => {
  return String(y);
};

export const r2y = (row: number | string) => {
  if (typeof row === "string") {
    row = parseInt(row, 10);
  }
  return row;
};

export const pointoToAddress = ([y, x]: Point) => {
  return `${x2c(x)}${y2r(y)}`;
};

export const matrix2tsv = (
  store: StoreType,
  y: number,
  x: number,
  matrix: MatrixType
): string => {
  const { table } = store;
  const lines: string[] = [];
  matrix.map((row, i) => {
    const cols: string[] = [];
    row.map((col, j) => {
      const value = table.stringify([y + i, x + j], col);
      if (value.indexOf("\n") !== -1) {
        cols.push(`"${value.replace(/"/g, '""')}"`);
      } else {
        cols.push(value);
      }
    });
    lines.push(cols.join("\t"));
  });
  return lines.join("\n");
};

const restoreDoubleQuote = (text: string) => text.replace(/\x00/g, '"');

export const tsv2matrix = (tsv: string): string[][] => {
  tsv = tsv.replace(/""/g, "\x00");
  const rows: string[][] = [[]];
  let row = rows[0];
  let entering = false;
  let word = "";
  for (let i = 0; i < tsv.length; i++) {
    const s = tsv[i];
    if (s === "\n" && !entering) {
      row.push(restoreDoubleQuote(word));
      word = "";
      row = [];
      rows.push(row);
      continue;
    }
    if (s === "\t") {
      row.push(restoreDoubleQuote(word));
      word = "";
      continue;
    }
    if (s === '"' && !entering && word === "") {
      entering = true;
      continue;
    }
    if (s === '"' && entering) {
      entering = false;
      continue;
    }
    word += s;
  }
  if (word) {
    row.push(restoreDoubleQuote(word));
  }
  return rows;
};

export const addressToPoint = (address: Address): [Y, X] => {
  const m = address.match(/([A-Z]*)([0-9]*)/);
  if (m == null) {
    return [0, 0];
  }
  const [_, col, row] = m.slice();
  return [r2y(row) || 0, c2x(col) || 0];
};
