import {
  DataType,
  AreaType,
} from "../types";


export const cropMatrix = (matrix: DataType, area: AreaType): DataType => {
  const [top, left, bottom, right] = area;
  return matrix.slice(top, bottom + 1).map((cols) => cols.slice(left, right + 1));
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
