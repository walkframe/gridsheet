import {
  MatrixType,
  AreaType,
  ZoneType,
  RangeType,
  PointType,
  Y,
  X,
  CellsByAddressType,
  RowByAddress,
  ShapeType,
  Address,
} from "../types";
import { a2p, p2a } from "./converters";

export const slideArea = (area: AreaType, y: Y, x: X): AreaType => {
  const { top, left, bottom, right } = area;
  return { top: top + y, left: left + x, bottom: bottom + y, right: right + x };
};

export const superposeArea = (
  srcArea: AreaType,
  dstArea: AreaType
): ShapeType => {
  const { height: srcHeight, width: srcWidth } = areaShape(srcArea);
  const { height: dstHeight, width: dstWidth } = areaShape(dstArea);

  // biggerHeight, biggerWidth
  return {
    height: srcHeight > dstHeight ? srcHeight : dstHeight,
    width: srcWidth > dstWidth ? srcWidth : dstWidth,
  };
};

export const Y_START = 0,
  X_START = 1,
  Y_END = 2,
  X_END = 3;

export const zoneToArea = (zone: ZoneType): AreaType => {
  const [top, bottom] =
    zone.startY < zone.endY
      ? [zone.startY, zone.endY]
      : [zone.endY, zone.startY];
  const [left, right] =
    zone.startX < zone.endX
      ? [zone.startX, zone.endX]
      : [zone.endX, zone.startX];
  return { top, left, bottom, right };
};

export const areaToZone = (area: AreaType): ZoneType => {
  return {
    startY: area.top,
    startX: area.left,
    endY: area.bottom,
    endX: area.right,
  };
};

export const areaToRange = (area: AreaType): string => {
  const { top, left, bottom, right } = area;
  return `${p2a({ y: top, x: left })}${p2a({
    y: bottom,
    x: right,
  })}`;
};

export const rangeToArea = (range: string): AreaType => {
  const cells = range.split(":");
  const [start, end] = cells;
  const { y: top, x: left } = a2p(start);
  const { y: bottom, x: right } = a2p(end);
  return { top, left, bottom, right };
};

export const between = (range: RangeType, index: number) => {
  if (range.start === -1 || range.end === -1) {
    return false;
  }
  return (
    (range.start <= index && index <= range.end) ||
    (range.end <= index && index <= range.start)
  );
};

export const among = (area: AreaType, point: PointType) => {
  if (
    area.top === -1 ||
    area.left === -1 ||
    area.bottom === -1 ||
    area.right === -1
  ) {
    return false;
  }
  const { y, x } = point;
  const { top, left, bottom, right } = area;
  return top <= y && y <= bottom && left <= x && x <= right;
};

export const zoneShape = (zone: ZoneType, base = 0): ShapeType => {
  return {
    height: base + Math.abs(zone.startY - zone.endY),
    width: base + Math.abs(zone.startX - zone.endX),
  };
};

export const areaShape = (area: AreaType, base = 0): ShapeType => {
  return {
    height: base + Math.abs(area.top - area.bottom),
    width: base + Math.abs(area.left - area.right),
  };
};

export const matrixShape = (matrix: MatrixType, base = 0): ShapeType => {
  const h = matrix.length;
  if (h === 0) {
    return { height: 0, width: 0 };
  }
  return { height: base + h, width: base + matrix[0].length };
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

export const fillMatrix = <T = any>(dst: T[][], src: T[][], area: AreaType) => {
  const lostRows: RowByAddress<T> = new Map();
  const { top, left, bottom, right } = area;
  const { height: dstNumRows, width: dstNumCols } = matrixShape(dst, 1);
  for (let y = top; y <= bottom; y++) {
    const lostRow: T[] = [];
    for (let x = left; x <= right; x++) {
      const value = src[y - top][x - left];
      // -1 means excluding headers
      if (y < dstNumRows - 1 && x < dstNumCols - 1) {
        dst[y][x] = value;
        continue;
      }
      if (lostRow.length === 0) {
        lostRows.set(p2a({ y, x }), lostRow);
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
  const { top, left, bottom, right } = area;
  return matrix
    .slice(top, bottom + 1)
    .map((cols) => cols.slice(left, right + 1));
};

export const generateInitial = ({
  cells = {},
  ensured = {},
  values: matrix = [],
  valuesOrigin: matrixOrigin = "A1",
}: {
  cells?: CellsByAddressType;
  ensured?: {
    numRows?: number;
    numCols?: number;
  };
  values?: MatrixType;
  valuesOrigin?: Address;
} = {}) => {
  const { y: baseY, x: baseX } = a2p(matrixOrigin);
  matrix.map((row, y) => {
    row.map((value, x) => {
      const id = p2a({ y: baseY + y, x: baseX + x });
      if (typeof value !== "undefined") {
        const cell = cells[id];
        cells[id] = { value, ...cell };
      }
    });
  });
  const { numRows, numCols } = Object.assign(
    { numRows: 1, numCols: 1 },
    ensured
  );
  const rightBottom = p2a({ y: numRows, x: numCols });
  if (cells[rightBottom] == null) {
    cells[rightBottom] = { value: undefined };
  }
  return cells;
};

export const getMaxSizesFromCells = (cells: CellsByAddressType = {}) => {
  let [lastY, lastX] = [0, 0];
  Object.keys(cells).map((address) => {
    const { y, x } = a2p(address);
    if (lastY < y) {
      lastY = y;
    }
    if (lastX < x) {
      lastX = x;
    }
  });
  return { numRows: lastY, numCols: lastX };
};
