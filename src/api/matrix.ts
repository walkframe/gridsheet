import {
  DataType,
  AreaType,
} from "../types";

export const cropMatrix = (matrix: DataType, area: AreaType): DataType => {
  const [top, left, bottom, right] = area;
  return matrix.slice(top, bottom + 1).map((cols) => cols.slice(left, right + 1));
};

export const makeMatrix = (initial: string, height: number, width: number) => {
  const matrix: DataType = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      row.push(initial);
    }
    matrix.push(row);
  }
  return matrix;
};


export const writeMatrix = (src: DataType, srcArea: AreaType, dst: DataType, dstArea: AreaType): DataType => {
  const [srcTop, srcLeft, srcBottom, srcRight] = srcArea;
  const [dstTop, dstLeft, dstBottom, dstRight] = dstArea;
  const [srcHeight, srcWidth, dstHeight, dstWidth] = [srcBottom - srcTop, srcRight - srcLeft, dstBottom - dstTop, dstRight - dstLeft];

  for (let y = 0; y <= dstHeight; y++) {
    if (dstTop + y >= dst.length) {
      continue;
    }
    const rowSrc = src[y % (srcHeight + 1)];
    const rowDst = dst[dstTop + y];
    for (let x = 0; x <= dstWidth; x++) {
      if (dstLeft + x >= rowDst.length) {
        continue;
      }
      rowDst[dstLeft + x] = rowSrc[x % (srcWidth + 1)];
    }
  }
  return dst;
};

export const superposeArea = (srcArea: AreaType, dstArea: AreaType): [number, number] => {
  const [srcTop, srcLeft, srcBottom, srcRight] = srcArea;
  const [dstTop, dstLeft, dstBottom, dstRight] = dstArea;
  const [srcHeight, srcWidth, dstHeight, dstWidth] = [srcBottom - srcTop, srcRight - srcLeft, dstBottom - dstTop, dstRight - dstLeft];

  // biggerHeight, biggerWidth
  return [srcHeight > dstHeight ? srcHeight : dstHeight, srcWidth > dstWidth ? srcWidth : dstWidth];
};

export const spreadMatrix = (src: DataType, height: number, width: number): DataType => {
  const matrix = makeMatrix("", height + 1, width + 1);
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x <= width; x++) {
      matrix[y][x] = src[y % src.length][x % src[0].length];
    }
  }
  return matrix;
};
