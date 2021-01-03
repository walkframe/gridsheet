import { Renderer } from "../renderers/core";
import { Parser } from "../parsers/core";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const N2A_CACHE: {[s: string]: string} = {};
const A2N_CACHE: {[s: string]: number} = {};

export const n2a = (num: number, useCache=true): string => {
  if (useCache && N2A_CACHE[num]) {
    return N2A_CACHE[num];
  }
  let result = "";
  do {
    result = ALPHABET[--num % 26] + result;
    num = Math.floor(num / 26);
  } while(num > 0);
  if (useCache) {
    N2A_CACHE[num] = result;
    A2N_CACHE[result] = num;
  }
  return result;
};

export const a2n = (alpha: string, useCache=true): number => {
  if (useCache && A2N_CACHE[alpha]) {
    return A2N_CACHE[alpha];
  }
  let result = 0;
  for (let digit = 0; digit < alpha.length; digit++) {
    const a = alpha[alpha.length - digit - 1];
    const num = ALPHABET.indexOf(a) + 1;
    result += (ALPHABET.length ** digit) * num;
  }
  if (useCache) {
    N2A_CACHE[result] = alpha;
    A2N_CACHE[alpha] = result;
  }
  return result;
};

export const matrix2tsv = (rows: any[][], renderer=Renderer): string => {
  const lines: string[] = [];
  rows.map((row) => {
    const cols: string[] = [];
    row.map((col) => {
      const value = new renderer(col).stringify();
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

export const tsv2matrix = (tsv: string, parser=Parser): any[][] => {
  tsv = tsv.replace(/""/g, "\x00");
  const restoreDoubleQuote = (text: string) => text.replace(/\x00/g, '"');
  const rows: any[][] = [];
  let row: any[] = [];
  if (tsv.indexOf("\t") === -1) { // 1col
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
    return cols.map((col) => [new Parser(restoreDoubleQuote(col)).parse()]);
  }
  tsv.split("\t").map((col) => {
    if (col[0] === '"' && col[col.length-1] === '"') { // escaping
      const cell = restoreDoubleQuote(col.substring(1, col.length - 1));
      row.push(new parser(cell).parse());
    } else {
      const enterIndex = col.indexOf("\n");
      if (enterIndex === -1) {
        const cell = restoreDoubleQuote(col);
        row.push(new parser(cell).parse());
      } else {
        const cell = restoreDoubleQuote(col.substring(0, enterIndex));
        row.push(new parser(cell).parse());
        rows.push(row);
        row = [];
        const nextCol = col.substring(enterIndex + 1, col.length);
        if (nextCol) {
          const nextCell = restoreDoubleQuote(nextCol);
          row.push(new parser(nextCell).parse());
        }
      }
    }
  });
  if (row.length > 0) {
    rows.push(row);
  }
  return rows;
};
