
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
  const rows: string[][] = [];
  let row: string[] = [];
  if (tsv.indexOf("\t") === -1) {
    return tsv.split("\n").map((col) => [col]);
  }
  tsv.split("\t").map((col) => {
    if (col[0] === '"' && col[col.length-1] === '"') { // escaping
      row.push(col.substring(1, col.length - 1).replace(/""/g, '"'));
    } else {
      const enterIndex = col.indexOf("\n");
      if (enterIndex === -1) {
        row.push(col);
      } else {
        row.push(col.substring(0, enterIndex));
        rows.push(row);
        row = [];
        const nextCol = col.substring(enterIndex + 1, col.length)
        if (nextCol) {
          row.push(nextCol);
        }
      }
    }
  });
  if (row.length > 0) {
    rows.push(row);
  }
  return rows;
};
