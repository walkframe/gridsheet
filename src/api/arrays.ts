import {
  MatrixType,
  AreaType,
  DraggingType,
  RangeType,
  PositionType,
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
  const [srcHeight, srcWidth] = shape(srcArea);
  const [dstHeight, dstWidth] = shape(dstArea);

  // biggerHeight, biggerWidth
  return [srcHeight > dstHeight ? srcHeight : dstHeight, srcWidth > dstWidth ? srcWidth : dstWidth];
};

export const Y_START = 0, X_START = 1, Y_END = 2, X_END = 3;

export const draggingToArea = (dragging: DraggingType): AreaType => {
  const [top, bottom] = dragging[Y_START] < dragging[Y_END] ? [dragging[Y_START], dragging[Y_END]] : [dragging[Y_END], dragging[Y_START]];
  const [left, right] = dragging[X_START] < dragging[X_END] ? [dragging[X_START], dragging[X_END]] : [dragging[X_END], dragging[X_START]];
  return [top, left, bottom, right];
};

export const between = (range: RangeType, index: number) => {
  if (range[0] === -1 || range[1] === -1) {
    return false;
  }
  return (range[0] <= index && index <= range[1]) || (range[1] <= index && index <= range[0]);
};

export const among = (area: AreaType, position: PositionType) => {
  const [y, x] = position;
  const [top, left, bottom, right] = area;
  return top <= y && y <= bottom && left <= x && x <= right;
};

export const shape = (area: AreaType | DraggingType): [number, number] => {
  return [Math.abs(area[0] - area[2]), Math.abs(area[1] - area[3])];
};

export const makeSequence = (start: number, stop: number, step: number=1) => {
  return Array.from({ length: (stop - start - 1) / step + 1}, (_, i) => start + (i * step));
};
