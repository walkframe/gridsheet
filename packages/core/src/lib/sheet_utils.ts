import type { Address, AreaType, CellsByAddressType, CellType, Id } from '../types';
import type { UserSheet } from './sheet';
import { a2p, p2a, x2c, c2x, y2r } from './coords';
import { createMatrix } from './spatial';
import { filterCellFields } from './cell';
import type { CellFilter, Resolution } from '../types';
import type { SolveOptions } from '../formula/solver';

const noFilter: CellFilter = () => true;

type CellField = keyof CellType;

type ToProps = {
  resolution?: Resolution;
  raise?: boolean;
  filter?: CellFilter;
  asScalar?: boolean;
};

type ToCellProps = ToProps & {
  ignoreFields?: CellField[];
};

/**
 * @internal — used by Sheet._toValueMatrix and solver.ts; keeps resolution for internal wiring.
 */

export type ToValueMatrixProps = ToProps & {
  area?: AreaType;
};

export type ToCellMatrixProps = ToCellProps & {
  area?: AreaType;
};

export type ToValueObjectProps = ToProps & {
  addresses?: Address[];
};

export type ToCellObjectProps = ToCellProps & {
  addresses?: Address[];
};

export type ToValueRowsProps = ToProps & {
  rows?: number[];
};

export type ToCellRowsProps = ToCellProps & {
  rows?: number[];
};

export type ToValueColsProps = ToProps & {
  cols?: (number | string)[];
};

export type ToCellColsProps = ToCellProps & {
  cols?: (number | string)[];
};

export const getCellByAddress = (
  sheet: UserSheet,
  address: Address,
  options: SolveOptions = {},
): CellType | undefined => {
  const point = a2p(address);
  return sheet.getCell(point, options);
};

export const toValueMatrix = (
  sheet: UserSheet,
  { area, resolution = 'RESOLVED', raise = false, filter = noFilter, asScalar = false }: ToValueMatrixProps = {},
): any[][] => {
  return sheet.__raw__._toValueMatrix({ area, resolution, raise, filter, asScalar });
};

export const toValueObject = (
  sheet: UserSheet,
  { resolution = 'RESOLVED', raise = false, filter = noFilter, addresses, asScalar = false }: ToValueObjectProps = {},
): { [address: Address]: any } => {
  const result: { [Address: Address]: any } = {};
  if (addresses) {
    for (const addr of addresses) {
      const point = a2p(addr);
      const cell = getCellByAddress(sheet, addr, { resolution, raise }) ?? {};
      if (filter(cell)) {
        let fieldValue = cell.value;
        if (asScalar) {
          const policy = sheet.getPolicy(point);
          fieldValue = policy.toScalar({ value: cell.value, cell, sheet: sheet.__raw__, point });
        }
        result[addr] = fieldValue;
      }
    }
    return result;
  }
  const { top, left, bottom, right } = sheet.area;
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const cell = sheet.getCell({ y, x }, { resolution, raise }) ?? {};
      if (filter(cell)) {
        let fieldValue = cell.value;
        if (asScalar) {
          const policy = sheet.getPolicy({ y, x });
          fieldValue = policy.toScalar({ value: cell.value, cell, sheet: sheet.__raw__, point: { y, x } });
        }
        result[p2a({ y, x })] = fieldValue;
      }
    }
  }
  return result;
};

export const toValueRows = (
  sheet: UserSheet,
  { resolution = 'RESOLVED', raise = false, filter = noFilter, rows, asScalar = false }: ToValueRowsProps = {},
): CellsByAddressType[] => {
  const result: CellsByAddressType[] = [];
  const { top, left, bottom, right } = sheet.area;
  const ys = rows ?? Array.from({ length: sheet.numRows }, (_, i) => top + i);
  for (const y of ys) {
    const row: CellsByAddressType = {};
    result.push(row);
    for (let x = left; x <= right; x++) {
      const cell = sheet.getCell({ y, x }, { resolution, raise }) ?? {};
      if (filter(cell)) {
        let fieldValue = cell.value;
        if (asScalar) {
          const policy = sheet.getPolicy({ y, x });
          fieldValue = policy.toScalar({ value: cell.value, cell, sheet: sheet.__raw__, point: { y, x } });
        }
        row[x2c(x)] = fieldValue as any;
      }
    }
  }
  return result;
};

export const toValueCols = (
  sheet: UserSheet,
  { resolution = 'RESOLVED', raise = false, filter = noFilter, cols, asScalar = false }: ToValueColsProps = {},
): CellsByAddressType[] => {
  const result: CellsByAddressType[] = [];
  const { top, left, bottom, right } = sheet.area;
  const xs = cols
    ? cols.map((c) => (typeof c === 'string' ? c2x(c) : c))
    : Array.from({ length: sheet.numCols }, (_, i) => left + i);
  for (const x of xs) {
    const col: CellsByAddressType = {};
    result.push(col);
    for (let y = top; y <= bottom; y++) {
      const cell = sheet.getCell({ y, x }, { resolution, raise }) ?? {};
      if (filter(cell)) {
        let fieldValue = cell.value;
        if (asScalar) {
          const policy = sheet.getPolicy({ y, x });
          fieldValue = policy.toScalar({ value: cell.value, cell, sheet: sheet.__raw__, point: { y, x } });
        }
        col[y2r(y)] = fieldValue as any;
      }
    }
  }
  return result;
};

export const toCellMatrix = (
  sheet: UserSheet,
  { area, resolution = 'RESOLVED', raise = false, filter = noFilter, ignoreFields = [] }: ToCellMatrixProps = {},
): (CellType | null)[][] => {
  const { top, left, bottom, right } = area ?? {
    top: 1,
    left: 1,
    bottom: sheet.area.bottom,
    right: sheet.area.right,
  };
  const matrix = createMatrix(bottom - top + 1, right - left + 1);
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const cell = sheet.getCell({ y, x }, { resolution, raise }) ?? {};
      if (filter(cell)) {
        const filteredCell = filterCellFields(cell, ignoreFields);
        matrix[y - top][x - left] = filteredCell;
      }
    }
  }
  return matrix;
};

export const toCellObject = (
  sheet: UserSheet,
  { resolution = 'RESOLVED', raise = false, filter = noFilter, addresses, ignoreFields = [] }: ToCellObjectProps = {},
): CellsByAddressType => {
  const result: CellsByAddressType = {};
  if (addresses) {
    for (const addr of addresses) {
      const cell = getCellByAddress(sheet, addr, { resolution, raise }) ?? {};
      if (filter(cell)) {
        result[addr] = filterCellFields(cell, ignoreFields);
      }
    }
    return result;
  }
  const { bottom, right } = sheet.area;
  for (let y = 1; y <= bottom; y++) {
    for (let x = 1; x <= right; x++) {
      const cell = sheet.getCell({ y, x }, { resolution, raise }) ?? {};
      if (filter(cell)) {
        result[p2a({ y, x })] = filterCellFields(cell, ignoreFields);
      }
    }
  }
  return result;
};

export const toCellRows = (
  sheet: UserSheet,
  { resolution = 'RESOLVED', raise = false, filter = noFilter, rows, ignoreFields = [] }: ToCellRowsProps = {},
): CellsByAddressType[] => {
  const result: CellsByAddressType[] = [];
  const { top, left, bottom, right } = sheet.area;
  const ys = rows ?? Array.from({ length: sheet.numRows }, (_, i) => top + i);
  for (const y of ys) {
    const row: CellsByAddressType = {};
    result.push(row);
    for (let x = left; x <= right; x++) {
      const cell = sheet.getCell({ y, x }, { resolution, raise }) ?? {};
      if (filter(cell)) {
        row[x2c(x)] = filterCellFields(cell, ignoreFields);
      }
    }
  }
  return result;
};

export const escapeSheetName = (name: string): string => {
  const escaped = name.replace(/'/g, "''");
  return `'${escaped}'`;
};

export const toSheetPrefix = (name?: string): string => {
  if (name) {
    return `${escapeSheetName(name)}!`;
  }
  return '';
};

export const toCellCols = (
  sheet: UserSheet,
  { resolution = 'RESOLVED', raise = false, filter = noFilter, cols, ignoreFields = [] }: ToCellColsProps = {},
): CellsByAddressType[] => {
  const result: CellsByAddressType[] = [];
  const { top, left, bottom, right } = sheet.area;
  const xs = cols
    ? cols.map((c) => (typeof c === 'string' ? c2x(c) : c))
    : Array.from({ length: sheet.numCols }, (_, i) => left + i);
  for (const x of xs) {
    const col: CellsByAddressType = {};
    result.push(col);
    for (let y = top; y <= bottom; y++) {
      const cell = sheet.getCell({ y, x }, { resolution, raise }) ?? {};
      if (filter(cell)) {
        col[y2r(y)] = filterCellFields(cell, ignoreFields);
      }
    }
  }
  return result;
};
