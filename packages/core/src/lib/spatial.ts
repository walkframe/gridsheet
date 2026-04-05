import { DEFAULT_KEY, DEFAULT_COL_KEY, DEFAULT_ROW_KEY } from '../constants';
import type {
  MatrixType,
  AreaType,
  ZoneType,
  RangeType,
  PointType,
  CellsByAddressType,
  ShapeType,
  MatricesByAddress,
  CellType,
  Address,
} from '../types';
import { a2p, p2a, x2c, c2x } from './coords';

export const superposeArea = (srcArea: AreaType, dstArea: AreaType): ShapeType => {
  const { rows: srcRows, cols: srcCols } = areaDiff(srcArea);
  const { rows: dstRows, cols: dstCols } = areaDiff(dstArea);

  // biggerRows, biggerCols
  return {
    rows: srcRows > dstRows ? srcRows : dstRows,
    cols: srcCols > dstCols ? srcCols : dstCols,
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
  if (top === bottom && left === right) {
    return p2a({ y: top, x: left });
  }
  const leftTop = p2a({ y: top, x: left });
  const rightBottom = p2a({ y: bottom, x: right });
  return `${leftTop}:${rightBottom}`;
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

export const zoneDiff = (zone: ZoneType): ShapeType => {
  if (zone.endY === -1 || zone.endX === -1) {
    return { rows: 0, cols: 0 };
  }
  return {
    rows: Math.abs(zone.startY - zone.endY),
    cols: Math.abs(zone.startX - zone.endX),
  };
};

export const zoneShape = (zone: ZoneType): ShapeType => {
  if (zone.endY === -1 || zone.endX === -1) {
    return { rows: 1, cols: 1 };
  }
  return {
    rows: 1 + Math.abs(zone.startY - zone.endY),
    cols: 1 + Math.abs(zone.startX - zone.endX),
  };
};

export const areaDiff = (area: AreaType): ShapeType => {
  return {
    rows: Math.abs(area.top - area.bottom),
    cols: Math.abs(area.left - area.right),
  };
};

export const areaShape = (area: AreaType): ShapeType => {
  return {
    rows: 1 + Math.abs(area.top - area.bottom),
    cols: 1 + Math.abs(area.left - area.right),
  };
};

export const matrixShape = ({ base = 0, matrix }: { matrix: MatrixType } & ShapeExtension): ShapeType => {
  const h = matrix.length;
  if (h === 0) {
    return { rows: 0, cols: 0 };
  }
  return { rows: base + h, cols: base + matrix[0].length };
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

export const createMatrix = <T = any>(numRows: number, numCols: number, fill?: T): T[][] => {
  return [...Array(numRows)].map(() => Array(numCols).fill(fill));
};

export const buildInitialCellsFromOrigin = ({
  cells = {},
  ensured = {},
  matrix = [],
  flattenAs = 'value',
  origin = 'A1',
}: {
  cells?: CellsByAddressType;
  ensured?: {
    numRows?: number;
    numCols?: number;
  };
  flattenAs?: keyof CellType;
  matrix?: MatrixType;
  origin?: Address;
}) => {
  return buildInitialCells({
    cells,
    ensured,
    matrices: { [origin]: matrix },
    flattenAs,
  });
};

export const buildInitialCells = ({
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
  const userKeys = Object.keys(cells);
  // Only eagerly build cells for small matrices. For large ones, defer to
  // Sheet._ensureCellPopulated via __matrices so we avoid creating millions
  // of dictionary entries up front.
  const totalMatrixCells = Object.values(matrices).reduce((sum, m) => sum + m.length * (m[0]?.length ?? 0), 0);
  const EAGER_THRESHOLD = 100_000;
  const deferred = totalMatrixCells > EAGER_THRESHOLD;
  if (!deferred) {
    buildCells({ cells, flattenAs, matrices });
  } else {
    // Attach matrices for lazy resolution in Sheet.initialize()
    Object.defineProperty(cells, '__matrices', { value: matrices, configurable: true });
    Object.defineProperty(cells, '__flattenAs', { value: flattenAs, configurable: true });
  }
  const { numRows, numCols } = Object.assign({ numRows: 1, numCols: 1 }, ensured);
  const rightBottom = p2a({ y: numRows, x: numCols });
  if (cells[rightBottom] == null) {
    cells[rightBottom] = {};
  }
  // Only attach __userKeys for deferred matrices. When buildCells ran eagerly,
  // all keys are already in cells so Object.keys(cells) is correct.
  if (deferred) {
    userKeys.push(rightBottom);
    Object.defineProperty(cells, '__userKeys', { value: userKeys, configurable: true });
  }
  return cells;
};

export const buildCells = <T>({
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
    const colLetters: string[] = [];
    for (let y = 0; y < matrix.length; y++) {
      const row = matrix[y];
      const rowStr = String(baseY + y);
      for (let x = 0; x < row.length; x++) {
        if (colLetters[x] == null) {
          colLetters[x] = x2c(baseX + x);
        }
        const id = colLetters[x] + rowStr;
        if (flattenAs) {
          const cell = cells[id];
          if (cell) {
            if (!(flattenAs in cell)) {
              cell[flattenAs] = row[x];
            }
          } else {
            cells[id] = { [flattenAs]: row[x] };
          }
        } else {
          cells[id] = row[x] as CellType;
        }
      }
    }
  });
  return cells;
};

export const getMaxSizesFromCells = (cells: CellsByAddressType = {}, keys?: string[]) => {
  let [lastY, lastX] = [0, 0];
  (keys ?? Object.keys(cells)).forEach((address) => {
    if (address === DEFAULT_KEY || address === DEFAULT_COL_KEY || address === DEFAULT_ROW_KEY) {
      return;
    }
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

export const expandRange = (range: string): Address[] => {
  if (range.indexOf(':') === -1) {
    return [range];
  }

  const result: Address[] = [];

  const isRowRange = /^\d+\:\d+$/.test(range);

  if (isRowRange) {
    const [startRow, endRow] = range.split(':').map(Number);
    for (let row = startRow; row <= endRow; row++) {
      result.push(`${row}`);
    }
    return result;
  }

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

// restrictZone resets a zone if the zone consists of a single cell.
export const restrictZone = (zone: ZoneType): ZoneType => {
  const s = zoneDiff(zone);
  if (s.rows + s.cols === 0) {
    return { startY: -1, startX: -1, endY: -1, endX: -1 };
  }
  return { ...zone };
};

export type BinarySearchPredicate = (mid: number) => boolean;

export const binarySearch = (
  low: number,
  high: number,
  predicate: BinarySearchPredicate,
  lessThan: boolean,
): number => {
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (predicate(mid)) {
      if (lessThan) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    } else {
      if (lessThan) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
  }
  return lessThan ? low : high;
};

/**
 * Convert a list of addresses into an array of bounding areas.
 * Adjacent cells (4-connected: up/down/left/right) are grouped into the same area.
 * Each resulting AreaType is the bounding rectangle of one connected group.
 */
export const addressesToAreas = (addresses: Address[]): AreaType[] => {
  if (addresses.length === 0) {
    return [];
  }

  const points = addresses.map((addr) => {
    const { y, x } = a2p(addr);
    return { y, x };
  });

  const key = (y: number, x: number) => `${y},${x}`;
  const pointSet = new Set(points.map((p) => key(p.y, p.x)));
  const visited = new Set<string>();
  const areas: AreaType[] = [];

  for (const p of points) {
    const k = key(p.y, p.x);
    if (visited.has(k)) {
      continue;
    }

    // BFS to find connected component
    let top = p.y,
      left = p.x,
      bottom = p.y,
      right = p.x;
    const queue = [p];
    visited.add(k);

    while (queue.length > 0) {
      const { y, x } = queue.shift()!;
      if (y < top) {
        top = y;
      }
      if (y > bottom) {
        bottom = y;
      }
      if (x < left) {
        left = x;
      }
      if (x > right) {
        right = x;
      }

      for (const [dy, dx] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        const nk = key(y + dy, x + dx);
        if (pointSet.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push({ y: y + dy, x: x + dx });
        }
      }
    }

    areas.push({ top, left, bottom, right });
  }

  return areas;
};

/**
 * Extract unique column indices (x) from a list of addresses, ignoring row information.
 * @param asc - true: ascending, false: descending, null: insertion order
 */
export const addressesToCols = (addresses: Address[], asc: boolean | null = true): number[] => {
  const seen = new Set<number>();
  const cols: number[] = [];
  for (const addr of addresses) {
    const { x } = a2p(addr);
    if (!seen.has(x)) {
      seen.add(x);
      cols.push(x);
    }
  }
  if (asc === true) {
    cols.sort((a, b) => a - b);
  } else if (asc === false) {
    cols.sort((a, b) => b - a);
  }
  return cols;
};

/**
 * Extract unique row indices (y) from a list of addresses, ignoring column information.
 * @param asc - true: ascending, false: descending, null: insertion order
 */
export const addressesToRows = (addresses: Address[], asc: boolean | null = true): number[] => {
  const seen = new Set<number>();
  const rows: number[] = [];
  for (const addr of addresses) {
    const { y } = a2p(addr);
    if (!seen.has(y)) {
      seen.add(y);
      rows.push(y);
    }
  }
  if (asc === true) {
    rows.sort((a, b) => a - b);
  } else if (asc === false) {
    rows.sort((a, b) => b - a);
  }
  return rows;
};

export const isZoneNotSelected = (zone: ZoneType): boolean => {
  return zone.startY === -1 || zone.startX === -1 || zone.endY === -1 || zone.endX === -1;
};
