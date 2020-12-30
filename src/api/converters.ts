import { RendererType } from "../renderers/core";
import { ParserType } from "../parsers/core";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const CACHE: {[s: string]: string} = {};

export const convertNtoA = (num: number): string => {
  if (CACHE[num]) {
    return CACHE[num];
  }
  let result = "";
  do {
    result = ALPHABET[--num % 26] + result;
    num = Math.floor(num / 26);
  } while(num > 0);
  CACHE[num] = result;
  return result;
};

export const convertAtoN = (alpha: string): number => {
  return 0;
};

export const convertArrayToTSV = (rows: any[][], renderer: RendererType): string => {
  const lines: string[] = [];
  rows.map((row) => {
    const cols: string[] = [];
    row.map((col) => {
      const value = new renderer(col).renderEditing();
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

export const convertTSVToArray = (tsv: string, Parser: ParserType): any[][] => {
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
      row.push(new Parser(cell).parse());
    } else {
      const enterIndex = col.indexOf("\n");
      if (enterIndex === -1) {
        const cell = restoreDoubleQuote(col);
        row.push(new Parser(cell).parse());
      } else {
        const cell = restoreDoubleQuote(col.substring(0, enterIndex));
        row.push(new Parser(cell).parse());
        rows.push(row);
        row = [];
        const nextCol = col.substring(enterIndex + 1, col.length);
        if (nextCol) {
          const nextCell = restoreDoubleQuote(nextCol);
          row.push(new Parser(nextCell).parse());
        }
      }
    }
  });
  if (row.length > 0) {
    rows.push(row);
  }
  return rows;
};
