import type {
  MatrixType,
  AreaType,
  ZoneType,
  RangeType,
  PointType,
  Y,
  X,
  CellsByAddressType,
  ShapeType,
  MatricesByAddress,
  CellType,
  Address,
} from '../types';
import { a2p, p2a, x2c, c2x } from './converters';

export const slideArea = (area: AreaType, y: Y, x: X): AreaType => {
  const { top, left, bottom, right } = area;
  return { top: top + y, left: left + x, bottom: bottom + y, right: right + x };
};

export const superposeArea = (srcArea: AreaType, dstArea: AreaType): ShapeType => {
  const { height: srcHeight, width: srcWidth } = areaShape(srcArea);
  const { height: dstHeight, width: dstWidth } = areaShape(dstArea);

  // biggerHeight, biggerWidth
  return {
    height: srcHeight > dstHeight ? srcHeight : dstHeight,
    width: srcWidth > dstWidth ? srcWidth : dstWidth,
  };
};

export const concatAreas = (area1: AreaType, area2: AreaType): AreaType => {
  const result: AreaType = { ...area1 };
  if (area2.left < area1.left) {
    result.left = area2.left;
  }
  if (area2.right > area1.right) {
    result.right = area2.right;
  }
  if (area2.top < area1.top) {
    result.top = area2.top;
  }
  if (area2.bottom > area1.bottom) {
    result.bottom = area2.bottom;
  }
  return result;
};

export const zoneToArea = (zone: ZoneType): AreaType => {
  if (zone.endY === -1 || zone.endX === -1) {
    return { top: -1, left: -1, bottom: -1, right: -1 };
  }
  const [top, bottom] = zone.startY < zone.endY ? [zone.startY, zone.endY] : [zone.endY, zone.startY];
  const [left, right] = zone.startX < zone.endX ? [zone.startX, zone.endX] : [zone.endX, zone.startX];
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
  return `${p2a({ y: top, x: left })}:${p2a({
    y: bottom,
    x: right,
  })}`;
};

export const between = (range: RangeType, index: number) => {
  if (range.start === -1 || range.end === -1) {
    return false;
  }
  return (range.start <= index && index <= range.end) || (range.end <= index && index <= range.start);
};

export const among = (area: AreaType, point: PointType) => {
  if (area.top === -1 || area.left === -1 || area.bottom === -1 || area.right === -1) {
    return false;
  }
  const { y, x } = point;
  const { top, left, bottom, right } = area;
  return top <= y && y <= bottom && left <= x && x <= right;
};

type ShapeExtension = { base?: number };

export const zoneShape = ({ base = 0, ...zone }: ZoneType & ShapeExtension): ShapeType => {
  return {
    height: base + Math.abs(zone.startY - zone.endY),
    width: base + Math.abs(zone.startX - zone.endX),
  };
};

export const areaShape = ({ base = 0, ...area }: AreaType & ShapeExtension): ShapeType => {
  return {
    height: base + Math.abs(area.top - area.bottom),
    width: base + Math.abs(area.left - area.right),
  };
};

export const matrixShape = ({ base = 0, matrix }: { matrix: MatrixType } & ShapeExtension): ShapeType => {
  const h = matrix.length;
  if (h === 0) {
    return { height: 0, width: 0 };
  }
  return { height: base + h, width: base + matrix[0].length };
};

export const makeSequence = (start: number, stop: number, step: number = 1) => {
  return Array.from({ length: (stop - start - 1) / step + 1 }, (_, i) => start + i * step);
};

export const oa2aa = (oa: { [s: string]: any }[], fields: string[]): MatrixType => {
  const aa: any[][] = [];
  oa.forEach((o) => {
    const a: any[] = [];
    fields.forEach((field) => {
      a.push(o[field]);
    });
    aa.push(a);
  });
  return aa;
};

export const aa2oa = (aa: MatrixType, fields: string[]): { [s: string]: any }[] => {
  const oa: { [s: string]: any }[] = [];
  aa.forEach((a) => {
    const o: { [s: string]: any } = {};
    a.forEach((v, i) => {
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

export const putMatrix = <T = any>(
  dst: T[][],
  src: T[][],
  dstArea: AreaType,
  filter: (newValue: T, currentValue: T) => boolean = () => true,
) => {
  const lostRows: MatricesByAddress<T> = {};
  const { top, left, bottom, right } = dstArea;
  const { height: dstNumRows, width: dstNumCols } = matrixShape({
    matrix: dst,
    base: 1,
  });
  for (let y = top; y <= bottom; y++) {
    const lostRow: T[] = [];
    for (let x = left; x <= right; x++) {
      const value = src[y - top][x - left];
      // -1 means excluding headers
      if (y < dstNumRows - 1 && x < dstNumCols - 1) {
        if (filter(value, dst[y][x])) {
          dst[y][x] = value;
        }
        continue;
      }
      if (lostRow.length === 0) {
        lostRows[p2a({ y, x })] = [lostRow];
      }
      lostRow.push(value);
    }
  }
  return lostRows;
};

export const createMatrix = <T = any>(numRows: number, numCols: number, fill?: T): T[][] => {
  return [...Array(numRows)].map(() => Array(numCols).fill(fill));
};

export const cropMatrix = <T = any>(matrix: T[][], area: AreaType): T[][] => {
  const { top, left, bottom, right } = area;
  return matrix.slice(top, bottom + 1).map((cols) => cols.slice(left, right + 1));
};

export const constructInitialCellsOrigin = ({
  cells = {},
  ensured = {},
  matrix = [],
  flattenAs = 'value',
}: {
  cells?: CellsByAddressType;
  ensured?: {
    numRows?: number;
    numCols?: number;
  };
  flattenAs?: keyof CellType;
  matrix?: MatrixType;
}) => {
  return constructInitialCells({
    cells,
    ensured,
    matrices: { A1: matrix },
    flattenAs,
  });
};

export const constructInitialCells = ({
  cells = {},
  ensured = {},
  matrices = {},
  flattenAs = 'value',
}: {
  cells?: CellsByAddressType;
  ensured?: {
    numRows?: number;
    numCols?: number;
  };
  flattenAs?: keyof CellType;
  matrices?: MatricesByAddress<any>;
} = {}) => {
  upsert({ cells, flattenAs, matrices });
  const { numRows, numCols } = Object.assign({ numRows: 1, numCols: 1 }, ensured);
  const rightBottom = p2a({ y: numRows, x: numCols });
  if (cells[rightBottom] == null) {
    cells[rightBottom] = {};
  }
  return cells;
};

export const upsert = <T>({
  cells = {},
  matrices = {},
  flattenAs,
}: {
  cells?: CellsByAddressType;
  flattenAs?: keyof CellType;
  matrices?: MatricesByAddress<T>;
}) => {
  Object.keys(matrices).forEach((baseAddress) => {
    const matrix = matrices[baseAddress];
    const { y: baseY, x: baseX } = a2p(baseAddress);
    matrix.forEach((row, y) => {
      row.forEach((e, x) => {
        const id = p2a({ y: baseY + y, x: baseX + x });
        if (flattenAs) {
          const cell = cells[id];
          cells[id] = { [flattenAs]: e, ...cell };
        } else {
          cells[id] = e as CellType;
        }
      });
    });
  });
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

export const range = (start: number, end: number) => {
  const list: number[] = [];
  for (let i = start; i <= end; i++) {
    list.push(i);
  }
  return list;
};

export const complementSelectingArea = (selectingArea: AreaType, choosing: PointType) => {
  if (selectingArea.left === -1) {
    selectingArea = {
      left: choosing.x,
      top: choosing.y,
      right: choosing.x,
      bottom: choosing.y,
    };
  }
  return selectingArea;
};

export const isSameArea = (area1: AreaType, area2: AreaType) => {
  if (area1.top !== area2.top) {
    return false;
  }
  if (area1.left !== area2.left) {
    return false;
  }
  if (area1.bottom !== area2.bottom) {
    return false;
  }
  if (area1.right !== area2.right) {
    return false;
  }
  return true;
};

export const expandRange = (range: string): Address[] => {
  if (range.indexOf(':') === -1) {
    return [range];
  }

  const result: Address[] = [];
  // eslint-disable-next-line no-useless-escape
  const isRowRange = /^\d+\:\d+$/.test(range);

  if (isRowRange) {
    const [startRow, endRow] = range.split(':').map(Number);
    for (let row = startRow; row <= endRow; row++) {
      result.push(`${row}`);
    }
    return result;
  }
  // eslint-disable-next-line no-useless-escape
  const match = range.match(/^([A-Z]*)(\d+)?\:([A-Z]*)(\d+)?$/);
  if (!match) {
    console.error('Invalid range format', range);
    return [range];
  }

  const [, startCol, startRow, endCol, endRow] = match;
  const startColIndex = startCol ? c2x(startCol) : 1;
  const endColIndex = endCol ? c2x(endCol) : 1;

  for (let col = startColIndex; col <= endColIndex; col++) {
    const currentColumn = startCol || endCol ? x2c(col) : '';
    if (startRow && endRow) {
      for (let row = Number(startRow); row <= Number(endRow); row++) {
        result.push(`${currentColumn}${row}`);
      }
    } else if (!startRow && !endRow) {
      result.push(currentColumn);
    }
  }
  return result;
};
