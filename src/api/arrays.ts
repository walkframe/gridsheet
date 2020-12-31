import {
  MatrixType,
  AreaType,
  ZoneType,
  RangeType,
  PositionType,
  ReactionsType,
  Y, X,
  Height, Width,
} from "../types";

import { convertNtoA } from "./converters";

export const cropMatrix = (matrix: MatrixType, area: AreaType): MatrixType => {
  const [top, left, bottom, right] = area;
  return matrix.slice(top, bottom + 1).map((cols) => cols.slice(left, right + 1));
};

export const writeMatrix = (y: number, x: number, src: MatrixType, dst: MatrixType): MatrixType => {
  dst = dst.map(cols => ([... cols])); // unfasten immutable
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

export const spreadMatrix = (src: MatrixType, height: Height, width: Width): MatrixType => {
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

export const slideArea = (area: AreaType, y: Y, x: X): AreaType => {
  const [top, left, bottom, right] = area;
  return [top + y, left + x, bottom + y, right + x];
};

export const superposeArea = (srcArea: AreaType, dstArea: AreaType): [Height, Width] => {
  const [srcHeight, srcWidth] = zoneShape(srcArea);
  const [dstHeight, dstWidth] = zoneShape(dstArea);

  // biggerHeight, biggerWidth
  return [srcHeight > dstHeight ? srcHeight : dstHeight, srcWidth > dstWidth ? srcWidth : dstWidth];
};

export const Y_START = 0, X_START = 1, Y_END = 2, X_END = 3;

export const zoneToArea = (zone: ZoneType): AreaType => {
  const [top, bottom] = zone[Y_START] < zone[Y_END] ? [zone[Y_START], zone[Y_END]] : [zone[Y_END], zone[Y_START]];
  const [left, right] = zone[X_START] < zone[X_END] ? [zone[X_START], zone[X_END]] : [zone[X_END], zone[X_START]];
  return [top, left, bottom, right];
};

export const between = (range: RangeType, index: number) => {
  if (range[0] === -1 || range[1] === -1) {
    return false;
  }
  return (range[0] <= index && index <= range[1]) || (range[1] <= index && index <= range[0]);
};

export const among = (area: AreaType, position: PositionType) => {
  if (area[0] === -1 || area[1] === -1 || area[2] === -1 || area[3] === -1) {
    return false;
  }
  const [y, x] = position;
  const [top, left, bottom, right] = area;
  return top <= y && y <= bottom && left <= x && x <= right;
};

export const zoneShape = (zone: ZoneType): [Height, Width] => {
  return [Math.abs(zone[0] - zone[2]), Math.abs(zone[1] - zone[3])];
};

export const matrixShape = (matrix: MatrixType): [Height, Width] => {
  const h = matrix.length;
  if (h === 0) {
    return [0, 0]
  }
  return [h, matrix[h - 1].length];
};

export const makeSequence = (start: number, stop: number, step: number=1) => {
  return Array.from({ length: (stop - start - 1) / step + 1}, (_, i) => start + (i * step));
};

export const makeReactions = (... areas: (AreaType | ZoneType | PositionType)[]): ReactionsType => {
  const reactions: ReactionsType = {};
  const colsCache: {[s: string]: string} = {};
  areas.map((area) => {
    if (area.length === 2) { // PositionType
      const [y, x] = area;
      area = [y, x, y, x];
    }
    area = zoneToArea(area); // force format to area
    const [top, left, bottom, right] = area;
    if (top === -1 || left === -1) {
      return;
    }
    for (let y = top; y <= bottom; y++) {
      const row = y + 1;
      reactions[`${row}`] = true;
      for (let x = left; x <= right; x++) {
        let col = colsCache[x + 1];
        if (typeof col === "undefined") {
          col = convertNtoA(x + 1);
          colsCache[x + 1] = col;
        }
        reactions[`${col}`] = true;
        reactions[`${col}${row}`] = true;
      }
    }
  });
  return reactions;
};

export const oa2aa = (oa: {[s: string]: any}[], fields: string[]): any[][] => {
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

export const aa2oa = (aa: any[][], fields: string[]): {[s: string]: any} => {
  const oa: {[s: string]: any}[] = [];
  aa.map((a) => {
    const o: {[s: string]: any} = {};
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
