import {
  MatrixType,
  AreaType,
} from "../types";

export const cropMatrix = (matrix: MatrixType, area: AreaType): MatrixType => {
  const [top, left, bottom, right] = area;
  return matrix.slice(top, bottom + 1).map((cols) => cols.slice(left, right + 1));
};

export const writeMatrix = (y: number, x: number, src: MatrixType, dst: MatrixType): MatrixType => {
  src.map((row, i) => {
    if (y + i >= dst.length) {
      return;
    }
    row.map((col, j) => {
      if (x + j >= dst[0].length) {
        return;
      }
      dst[y + i][x + j] = col;
    });
  });
  return dst;
};

export const spreadMatrix = (src: MatrixType, height: number, width: number): MatrixType => {
  const dst: MatrixType = [];
  for (let y = 0; y <= height; y++) {
    const row: string[] = [];
    for (let x = 0; x <= width; x++) {
      const col = src[y % src.length][x % src[0].length];
      row.push(col);
    }
    dst.push(row);
  }
  return dst;
};

export const slideArea = (area: AreaType, y: number, x: number): AreaType => {
  const [top, left, bottom, right] = area;
  return [top + y, left + x, bottom + y, right + x];
}

export const superposeArea = (srcArea: AreaType, dstArea: AreaType): [number, number] => {
  const [srcTop, srcLeft, srcBottom, srcRight] = srcArea;
  const [dstTop, dstLeft, dstBottom, dstRight] = dstArea;
  const [srcHeight, srcWidth, dstHeight, dstWidth] = [srcBottom - srcTop, srcRight - srcLeft, dstBottom - dstTop, dstRight - dstLeft];

  // biggerHeight, biggerWidth
  return [srcHeight > dstHeight ? srcHeight : dstHeight, srcWidth > dstWidth ? srcWidth : dstWidth];
};

// shape