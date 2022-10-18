import { Area } from "../constants";
import {
  MatrixType,
  AreaType,
  ZoneType,
  RangeType,
  PositionType,
  Y,
  X,
  Height,
  Width,
  CellsType,
  RowByAddress,
} from "../types";
import { addressToPosition, positionToAddress } from "./converters";

export const slideArea = (area: AreaType, y: Y, x: X): AreaType => {
  const [top, left, bottom, right] = area;
  return [top + y, left + x, bottom + y, right + x];
};

export const superposeArea = (
  srcArea: AreaType,
  dstArea: AreaType
): [Height, Width] => {
  const [srcHeight, srcWidth] = zoneShape(srcArea);
  const [dstHeight, dstWidth] = zoneShape(dstArea);

  // biggerHeight, biggerWidth
  return [
    srcHeight > dstHeight ? srcHeight : dstHeight,
    srcWidth > dstWidth ? srcWidth : dstWidth,
  ];
};

export const Y_START = 0,
  X_START = 1,
  Y_END = 2,
  X_END = 3;

export const zoneToArea = (zone: ZoneType): AreaType => {
  const [top, bottom] =
    zone[Y_START] < zone[Y_END]
      ? [zone[Y_START], zone[Y_END]]
      : [zone[Y_END], zone[Y_START]];
  const [left, right] =
    zone[X_START] < zone[X_END]
      ? [zone[X_START], zone[X_END]]
      : [zone[X_END], zone[X_START]];
  return [top, left, bottom, right];
};

export const areaToRange = (area: AreaType): string => {
  const [top, left, bottom, right] = area;
  return `${positionToAddress([top, left])}${positionToAddress([
    bottom,
    right,
  ])}`;
};

export const rangeToArea = (range: string): AreaType => {
  const cells = range.split(":");
  const [start, end] = cells;
  return [...addressToPosition(start), ...addressToPosition(end)];
};

export const between = (range: RangeType, index: number) => {
  if (range[0] === -1 || range[1] === -1) {
    return false;
  }
  return (
    (range[0] <= index && index <= range[1]) ||
    (range[1] <= index && index <= range[0])
  );
};

export const among = (area: AreaType, position: PositionType) => {
  if (
    area[Area.Top] === -1 ||
    area[Area.Left] === -1 ||
    area[Area.Bottom] === -1 ||
    area[Area.Right] === -1
  ) {
    return false;
  }
  const [y, x] = position;
  const [top, left, bottom, right] = area;
  return top <= y && y <= bottom && left <= x && x <= right;
};

export const zoneShape = (zone: ZoneType, base = 0): [Height, Width] => {
  return [
    base + Math.abs(zone[Area.Top] - zone[Area.Bottom]),
    base + Math.abs(zone[Area.Left] - zone[Area.Right]),
  ];
};

export const matrixShape = (matrix: MatrixType, base = 0): [Height, Width] => {
  const h = matrix.length;
  if (h === 0) {
    return [0, 0];
  }
  return [base + h, base + matrix[0].length];
};

export const makeSequence = (start: number, stop: number, step: number = 1) => {
  return Array.from(
    { length: (stop - start - 1) / step + 1 },
    (_, i) => start + i * step
  );
};

export const oa2aa = (
  oa: { [s: string]: any }[],
  fields: string[]
): MatrixType => {
  const aa: any[][] = [];
  oa.map((o) => {
    const a: any[] = [];
    fields.map((field) => {
      a.push(o[field]);
    });
    aa.push(a);
  });
  return aa;
};

export const aa2oa = (
  aa: MatrixType,
  fields: string[]
): { [s: string]: any } => {
  const oa: { [s: string]: any }[] = [];
  aa.map((a) => {
    const o: { [s: string]: any } = {};
    a.map((v, i) => {
      if (i >= fields.length) {
        return;
      }
      const field = fields[i];
      o[field] = v;
    });
    oa.push(o);
  });
  return oa;
};

export const writeMatrix = <T = any>(
  dst: T[][],
  src: T[][],
  area: AreaType
) => {
  const lostRows: RowByAddress<T> = new Map();
  const [top, left, bottom, right] = area;
  const [dstNumRows, dstNumCols] = matrixShape(dst, 1);
  for (let y = top; y <= bottom; y++) {
    const lostRow: T[] = [];
    for (let x = left; x <= right; x++) {
      const value = src[y - top][x - left];
      // excluding headers
      if (y < dstNumRows - 1 && x < dstNumCols - 1) {
        dst[y][x] = value;
        continue;
      }
      if (lostRow.length === 0) {
        lostRows.set(positionToAddress([y, x]), lostRow);
      }
      lostRow.push(value);
    }
  }
  return lostRows;
};

export const createMatrix = (numRows: number, numCols: number, fill = null) => {
  return [...Array(numRows)].map(() => Array(numCols).fill(fill));
};

export const cropMatrix = <T = any>(matrix: T[][], area: AreaType): T[][] => {
  const [top, left, bottom, right] = area;
  return matrix
    .slice(top, bottom + 1)
    .map((cols) => cols.slice(left, right + 1));
};

export const matrixIntoCells = (
  matrix: MatrixType,
  cells: CellsType,
  origin = "A1"
) => {
  const [baseY, baseX] = addressToPosition(origin);
  matrix.map((row, y) => {
    row.map((value, x) => {
      const id = positionToAddress([baseY + y, baseX + x]);
      if (typeof value !== "undefined") {
        const cell = cells[id];
        cells[id] = { ...cell, value };
      }
    });
  });
  return cells;
};
