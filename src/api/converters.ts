
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const convertNtoA = (num: number): string => {
  let result = "";
  do {
    result = ALPHABET[--num % 26] + result;
    num = Math.floor(num / 26);
  } while(num > 0)
  return result;
};

export const convertAtoN = (alpha: string): number => {
  return 0;
};

export const convertArrayToTSV = (rows: string[][]): string => {
  const lines: string[] = [];
  rows.map((row) => {
    const cols: string[] = [];
    row.map((col) => {
      if (col.indexOf("\n") !== -1) {
        cols.push(`"${col.replace(/"/g, '""')}"`);
      } else {
        cols.push(col);
      }
    });
    lines.push(cols.join("\t"));
  });
  return lines.join("\n");
};

export const convertTSVToArray = (tsv: string): string[][] => {
  tsv = tsv.replace(/""/g, "\x00");
  const restoreDoubleQuote = (text: string) => text.replace(/\x00/g, '"');
  const rows: string[][] = [];
  let row: string[] = [];
  if (tsv.indexOf("\t") === -1) {
    const cols: string[] = [];
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
    if (col[0] === '"' && col[col.length-1] === '"') { // escaping
      row.push(restoreDoubleQuote(col.substring(1, col.length - 1)));
    } else {
      const enterIndex = col.indexOf("\n");
      if (enterIndex === -1) {
        row.push(restoreDoubleQuote(col));
      } else {
        row.push(restoreDoubleQuote(col.substring(0, enterIndex)));
        rows.push(row);
        row = [];
        const nextCol = col.substring(enterIndex + 1, col.length);
        if (nextCol) {
          row.push(restoreDoubleQuote(nextCol));
        }
      }
    }
  });
  if (row.length > 0) {
    rows.push(row);
  }
  return rows;
};
