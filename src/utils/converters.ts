
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
  return [[]];
};
