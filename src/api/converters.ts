import { CellsOptionType, MatrixType, Parsers, Renderers } from "../types";
import { defaultRenderer, Renderer as DefaultRenderer, RendererType } from "../renderers/core";
import { Parser as DefaultParser } from "../parsers/core";
import { DEFAULT_ALPHA_CACHE_SIZE } from "../constants";
import { stackOption } from "./arrays";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const N2A_CACHE = new Map<number, string>();
const A2N_CACHE = new Map<string, number>();

export const n2a = (
  key: number,
  cacheSize = DEFAULT_ALPHA_CACHE_SIZE
): string => {
  const cached = N2A_CACHE.get(key);
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
  cacheSize = DEFAULT_ALPHA_CACHE_SIZE
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
  cacheSize = DEFAULT_ALPHA_CACHE_SIZE
): string => {
  return n2a(x + 1, cacheSize);
};

export const c2x = (
  col: string,
  cacheSize = DEFAULT_ALPHA_CACHE_SIZE
): number => {
  return a2n(col, cacheSize) - 1;
};

export const y2r = (y: number) => {
  return y + 1;
};

export const r2y = (row: number | string) => {
  if (typeof row === "string") {
    row = parseInt(row, 10);
  }
  return row - 1;
};

export const matrix2tsv = (
  y: number,
  x: number,
  rows: MatrixType,
  cellsOption: CellsOptionType,
  renderers: Renderers,
): string => {
  const lines: string[] = [];
  rows.map((row, i) => {
    const cols: string[] = [];
    row.map((col, j) => {
      const key = stackOption(cellsOption, y + i, x + j).renderer;
      const renderer = renderers[key || ""] || defaultRenderer;
      const value = renderer.stringify(col);
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

export const tsv2matrix = (tsv: string): any[][] => {
  tsv = tsv.replace(/""/g, "\x00");
  const restoreDoubleQuote = (text: string) => text.replace(/\x00/g, '"');
  const rows: any[][] = [];
  let row: any[] = [];
  if (tsv.indexOf("\t") === -1) {
    // 1col
    const cols: any[] = [];
    const vals = tsv.split("\n");
    let enter = false;
    vals.map((val) => {
      if (enter) {
        if (val[val.length - 1] === '"') {
          enter = false;
          val = val.substring(0, val.length - 1);
        }
        cols[cols.length - 1] += `\n${val}`;
      } else {
        if (val.match(/^(\x00)*"/)) {
          enter = true;
          val = val.substring(1);
        }
        cols.push(val);
      }
    });
    return cols.map((col) => [restoreDoubleQuote(col)]);
  }
  tsv.split("\t").map((col) => {
    if (col[0] === '"' && col[col.length - 1] === '"') {
      // escaping
      const cell = restoreDoubleQuote(col.substring(1, col.length - 1));
      row.push(cell);
    } else {
      const enterIndex = col.indexOf("\n");
      if (enterIndex === -1) {
        const cell = restoreDoubleQuote(col);
        row.push(cell);
      } else {
        const cell = restoreDoubleQuote(col.substring(0, enterIndex));
        row.push(cell);
        rows.push(row);
        row = [];
        const nextCol = col.substring(enterIndex + 1, col.length);
        if (nextCol) {
          const nextCell = restoreDoubleQuote(nextCol);
          row.push(nextCell);
        }
      }
    }
  });
  if (row.length > 0) {
    rows.push(row);
  }
  return rows;
};
