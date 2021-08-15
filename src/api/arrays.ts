import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import {
  MatrixType,
  AreaType,
  ZoneType,
  RangeType,
  PositionType,
  FlattenedType,
  Y,
  X,
  Height,
  Width,
  CellsOptionType,
  CellOptionType,
  Parsers,
  Renderers,
} from "../types";

import { a2n, x2c, c2x, r2y, y2r } from "./converters";
import { defaultParser } from "../parsers/core";
import { defaultRenderer } from "../renderers/core";

export const cropMatrix = (matrix: MatrixType, area: AreaType): MatrixType => {
  const [top, left, bottom, right] = area;
  return matrix
    .slice(top, bottom + 1)
    .map((cols) => cols.slice(left, right + 1));
};

export const stringifyMatrix = (
  y: number,
  x: number,
  matrix: MatrixType,
  cellsOption: CellsOptionType,
  renderers: Renderers,
): MatrixType => {
  const result: MatrixType = [];
  matrix.map((row, i) => {
    const cols: any[] = [];
    row.map((col, j) => {
      const key = stackOption(cellsOption, y + i, x + j).parser;
      const renderer = renderers[key || ""] || defaultRenderer;
      cols.push(renderer.stringify(col));
    });
    result.push(cols);
  });
  return result;
}


export const writeMatrix = (
  y: number,
  x: number,
  src: MatrixType,
  dst: MatrixType,
  cellsOption: CellsOptionType,
  parsers: Parsers,
): MatrixType => {
  dst = dst.map((cols) => [...cols]); // unfasten immutable
  src.map((row, i) => {
    if (y + i >= dst.length) {
      return;
    }
    row.map((col, j) => {
      if (x + j >= dst[0].length) {
        return;
      }
      const parserKey = stackOption(cellsOption, y + i, x + j).parser;
      const parser = parsers[parserKey || ""] || defaultParser;
      dst[y + i][x + j] = parser.callback(col, dst[y + i][x + j]);
    });
  });
  return dst;
};

export const spreadMatrix = (
  src: MatrixType,
  height: Height,
  width: Width
): MatrixType => {
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
    return [0, 0];
  }
  return [h, matrix[h - 1].length];
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

export const cellToIndexes = (cellId: string): [Y, X] | undefined => {
  const m = cellId.match(/([A-Z]*)([0-9]*)/);
  if (m == null) {
    return undefined;
  }
  const [_, col, row] = m.slice();
  return [r2y(row), c2x(col)];
};

export const slideFlattened = (
  base: FlattenedType,
  height: number | null,
  width: number | null,
  y: number | null,
  x: number | null
): { [s: string]: any } => {
  const slided: FlattenedType = {};
  const splitted: [
    string | undefined,
    string | undefined,
    any
  ][] = Object.entries(base).map(([key, value]) => {
    const m = key.match(/([A-Z]*)([0-9]*)/);
    if (m == null) {
      return [undefined, undefined, value];
    }
    const [_, a, n] = m.slice();
    return [a, n, value];
  });

  if (y != null && height != null) {
    splitted
      .sort((a, b) => {
        if (typeof a[1] === "undefined" || typeof b[1] === "undefined") {
          return 1;
        }
        const [gt, lt] = height > 0 ? [-1, 1] : [1, -1];
        return parseInt(a[1], 10) > parseInt(b[1], 10) ? gt : lt;
      })
      .map(([a, n, value]) => {
        if (typeof n === "undefined") {
          return;
        }
        const rowNumber = parseInt(n, 10) - 1;
        if (height < 0 && y <= rowNumber && rowNumber < y - height) {
          slided[`-${a}${rowNumber + 1}`] = value;
          return;
        }
        if (
          Number.isNaN(rowNumber) ||
          rowNumber < y ||
          rowNumber + height < 1
        ) {
          return;
        }
        slided[`${a}${rowNumber + height + 1}`] = value;
        slided[`-${a}${n}`] = value;
      });
  }
  if (x !== null && width != null) {
    splitted
      .sort((a, b) => {
        if (typeof a[0] === "undefined" || typeof b[0] === "undefined") {
          return 1;
        }
        const [gt, lt] = width > 0 ? [-1, 1] : [1, -1];
        return a2n(a[0]) > a2n(b[0]) ? gt : lt;
      })
      .map(([a, n, value]) => {
        if (typeof a === "undefined") {
          return;
        }
        const colNumber = c2x(a);
        if (width < 0 && x <= colNumber && colNumber < x - width) {
          slided[`-${x2c(colNumber)}${n}`] = value;
          return;
        }
        if (Number.isNaN(colNumber) || colNumber < x || colNumber + width < 1) {
          return;
        }
        slided[`${x2c(colNumber + width)}${n}`] = value;
        slided[`-${a}${n}`] = value;
      });
  }
  return slided;
};

export const applyFlattened = (
  base: FlattenedType,
  next: FlattenedType
): FlattenedType => {
  const applied: FlattenedType = { ...base };
  Object.keys(next).map((key) => {
    if (key[0] === "-") {
      delete applied[key.substring(1)];
    }
  });
  Object.entries(next).map(([key, value]) => {
    if (key[0] !== "-") {
      applied[key] = value;
    }
  });
  return applied;
};

export const inverseFlattened = (before: FlattenedType): FlattenedType => {
  const after: FlattenedType = {};
  Object.entries(before).map(([key, value]) => {
    if (key[0] === "-") {
      after[key.substring(1)] = value;
    } else {
      after[`-${key}`] = value;
    }
  });
  return after;
};

export const rerenderCells = ({
  rows,
  cols,
  gridRef,
  verticalHeadersRef,
  horizontalHeadersRef,
}: {
  rows?: [number, number];
  cols?: [number, number];
  gridRef: React.MutableRefObject<Grid | null>;
  verticalHeadersRef: React.MutableRefObject<List | null>;
  horizontalHeadersRef: React.MutableRefObject<List | null>;
}) => {
  const [startY, endY] = rows || [0, 0];
  for (let index = startY; index <= endY; index++) {
    verticalHeadersRef.current?.resetAfterIndex(index);
    gridRef.current?.resetAfterRowIndex(index);
  }
  const [startX, endX] = cols || [0, 0];
  for (let index = startX; index <= endX; index++) {
    horizontalHeadersRef.current?.resetAfterIndex(index);
    gridRef.current?.resetAfterColumnIndex(index);
  }
};

export const stackOption = (cellsOption: CellsOptionType, y: number, x: number, ): CellOptionType => {
  const rowId = y2r(y);
  const colId = x2c(x);
  const cellId = `${colId}${rowId}`;
  const defaultOption: CellOptionType = cellsOption.default || {};
  const rowOption: CellOptionType = cellsOption[rowId] || {};
  const colOption: CellOptionType = cellsOption[colId] || {};
  const cellOption: CellOptionType = cellsOption[cellId] || {};
  return {
    ...defaultOption,
    ...rowOption,
    ...colOption,
    ...cellOption,
  };
};
