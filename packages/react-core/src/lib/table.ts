import { defaultParser } from '../parsers/core';
import { defaultRenderer, RendererCallProps } from '../renderers/core';
import {
  Id,
  Ids,
  IdMatrix,
  AreaType,
  CellsByIdType,
  CellsByAddressType,
  PointType,
  Address,
  CellFilter,
  MatrixType,
  CellType,
  HistoryType,
  StorePatchType,
  ShapeType,
  OperatorType,
  OperationType,
  RawCellType,
  ExtraPointType,
  StoreType,
  RefEvaluation,
} from '../types';
import {
  among,
  areaShape,
  createMatrix,
  expandRange,
  getMaxSizesFromCells,
  invertObject,
  matrixShape,
  putMatrix,
} from './structs';
import { a2p, x2c, p2a, y2r, grantAddressAbsolute } from './converters';
import { FunctionMapping } from '../formula/functions/__base';
import { identifyFormula, Lexer, splitRef, stripSheetName } from '../formula/evaluator';
import { solveFormula, stripTable } from '../formula/solver';

import { DEFAULT_HEIGHT, DEFAULT_WIDTH, HEADER_HEIGHT, HEADER_WIDTH, DEFAULT_HISTORY_LIMIT } from '../constants';
import { shouldTracking } from '../store/helpers';
import { updateTable } from '../store/actions';
import * as operation from './operation';
import { Wire, createWire } from './hub';
import { safeQueueMicrotask } from './time';
import { defaultPolicy, PolicyType } from '../policy/core';
import { escapeSheetName, getSheetPrefix } from './sheet';
import { ReferencePreserver } from './reference';

type Props = {
  minNumRows?: number;
  maxNumRows?: number;
  minNumCols?: number;
  maxNumCols?: number;
  functions?: FunctionMapping;
  sheetName?: string;
  hub?: Wire;
};

const noFilter: CellFilter = () => true;

type GetProps = {
  // do not use 'SYSTEM', it is reserved for internal use.
  refEvaluation?: RefEvaluation;
  raise?: boolean;
  filter?: CellFilter;
};

type MoveProps = {
  srcTable?: UserTable;
  src: AreaType;
  dst: AreaType;
  operator?: OperatorType;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  historicize?: boolean;
};

type GetFieldProps = GetProps & {
  field?: keyof CellType;
};

type GetPropsWithArea = GetProps & {
  area?: AreaType;
};

type GetFieldPropsWithArea = GetFieldProps & {
  area?: AreaType;
};

export interface UserTable {
  changedAt: Date;
  lastChangedAt?: Date;
  top: number;
  left: number;
  bottom: number;
  right: number;
  minNumRows: number;
  maxNumRows: number;
  minNumCols: number;
  maxNumCols: number;
  headerWidth: number;
  headerHeight: number;
  sheetName: string;

  /**
   * Returns the raw table object, which is used for internal operations.
   * This is not intended for public use and may change in future versions.
   */
  __raw__: Table;

  getRectSize(area: AreaType): ShapeType;
  getCellByPoint(point: PointType, refEvaluation?: RefEvaluation, raise?: boolean): CellType | undefined;
  getCellByAddress(address: Address, refEvaluation?: RefEvaluation, raise?: boolean): CellType | undefined;
  getNumRows(base?: number): number;
  getNumCols(base?: number): number;
  getFieldMatrix(args?: GetFieldPropsWithArea): any[][];
  getFieldObject(args?: GetFieldProps): { [address: Address]: any };
  getFieldRows(args?: GetFieldProps): { [address: Address]: any }[];
  getFieldCols(args?: GetFieldProps): { [address: Address]: any }[];
  getMatrix(args?: GetPropsWithArea): (CellType | null)[][];
  getObject(args?: GetProps): CellsByAddressType;
  getRows(args?: GetProps): CellsByAddressType[];
  getCols(args?: GetProps): CellsByAddressType[];
  getHistories(): HistoryType[];
  move(args: MoveProps): UserTable;
  copy(args: MoveProps & { onlyValue?: boolean }): UserTable;
  update(args: {
    diff: CellsByAddressType;
    historicize?: boolean;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StorePatchType;
  }): UserTable;
  writeMatrix(args: {
    point: PointType;
    matrix: MatrixType<string>;
    updateChangedAt?: boolean;
    reflection?: StorePatchType;
  }): UserTable;
  write(args: { point: PointType; value: string; updateChangedAt?: boolean; reflection?: StorePatchType }): UserTable;
  insertRows(args: {
    y: number;
    numRows: number;
    baseY: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StorePatchType;
  }): UserTable;
  removeRows(args: { y: number; numRows: number; reflection?: StorePatchType }): UserTable;
  insertCols(args: {
    x: number;
    numCols: number;
    baseX: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StorePatchType;
  }): UserTable;
  removeCols(args: { x: number; numCols: number; reflection?: StorePatchType }): UserTable;
  undo(): {
    history: HistoryType | null;
  };
  redo(): {
    history: HistoryType | null;
  };
  getHistories(): HistoryType[];
  getHistoryIndex(): number;
  getHistorySize(): number;
  setHeaderHeight(height: number, historicize?: boolean): UserTable;
  setHeaderWidth(width: number, historicize?: boolean): UserTable;

  stringify(props: { point: PointType; cell?: CellType; refEvaluation?: RefEvaluation }): string;
}

export class Table implements UserTable {
  public changedAt: Date;
  public lastChangedAt?: Date;
  public minNumRows: number;
  public maxNumRows: number;
  public minNumCols: number;
  public maxNumCols: number;
  public sheetId: number = 0;
  public sheetName: string = '';
  public prevSheetName: string = '';
  public status: 0 | 1 | 2 = 0; // 0: not initialized, 1: initialized, 2: formula absoluted
  public wire: Wire;
  public idsToBeIdentified: Id[] = [];
  public totalWidth = 0;
  public totalHeight = 0;

  private version = 0;
  private idMatrix: IdMatrix;
  private area: AreaType = { top: 0, left: 0, bottom: 0, right: 0 };
  private addressCaches: Map<Id, Address> = new Map();

  constructor({
    minNumRows = 1,
    maxNumRows = -1,
    minNumCols = 1,
    maxNumCols = -1,
    sheetName,
    hub = createWire({}),
  }: Props) {
    this.idMatrix = [];
    this.changedAt = new Date();
    this.minNumRows = minNumRows || 0;
    this.maxNumRows = maxNumRows || 0;
    this.minNumCols = minNumCols || 0;
    this.maxNumCols = maxNumCols || 0;
    this.sheetName = sheetName || '';
    this.wire = hub;
  }

  get headerHeight() {
    return this.getCellByPoint({ y: 0, x: 0 }, 'SYSTEM')?.height || HEADER_HEIGHT;
  }

  setHeaderHeight(height: number, historicize = true) {
    return this.update({
      diff: { 0: { height } },
      partial: true,
      historicize,
    });
  }

  get headerWidth() {
    return this.getCellByPoint({ y: 0, x: 0 }, 'SYSTEM')?.width || HEADER_WIDTH;
  }

  setHeaderWidth(width: number, historicize = true) {
    return this.update({
      diff: { 0: { width } },
      partial: true,
      historicize,
    });
  }

  get isInitialized() {
    return this.status === 2;
  }

  get functions() {
    return this.wire.functions;
  }

  get parsers() {
    return this.wire.parsers;
  }

  get renderers() {
    return this.wire.renderers;
  }

  get labelers() {
    return this.wire.labelers;
  }

  get policies() {
    return this.wire.policies;
  }

  public identifyFormula() {
    this.idsToBeIdentified.forEach((id) => {
      const cell = this.wire.data[id];
      if (cell?.system?.sheetId == null) {
        return;
      }
      cell.value = identifyFormula(cell?.value, {
        table: this,
        dependency: id,
      });
    });
    this.idsToBeIdentified = [];
    this.status = 2;
  }

  public getSheetId() {
    return this.sheetId;
  }

  public getTableBySheetName(sheetName: string) {
    const sheetId = this.wire.sheetIdsByName[sheetName];
    return this.getTableBySheetId(sheetId);
  }
  public getTableBySheetId(sheetId: number) {
    return this.wire.contextsBySheetId[sheetId]?.store?.tableReactive?.current;
  }

  public initialize(cells: CellsByAddressType) {
    if (this.status > 1) {
      return;
    }
    if (cells[0] == null) {
      cells[0] = { width: HEADER_WIDTH, height: HEADER_HEIGHT };
    }
    const auto = getMaxSizesFromCells(cells);
    const changedAt = new Date();
    this.area = {
      top: 1,
      left: 1,
      bottom: auto.numRows,
      right: auto.numCols,
    };

    // make idMatrix beforehand
    for (let y = 0; y < auto.numRows + 1; y++) {
      const ids: Ids = [];
      this.idMatrix.push(ids);
      for (let x = 0; x < auto.numCols + 1; x++) {
        const id = this.generateId();
        ids.push(id);
        const address = p2a({ y, x });
        this.addressCaches.set(id, address);
      }
    }
    Object.keys(cells).forEach((address) => {
      const range = expandRange(address);
      const data = cells[address];
      range.forEach((address) => {
        const origin = cells[address];
        cells[address] = {
          ...origin,
          ...data,
          style: {
            ...origin?.style,
            ...data?.style,
          },
          prevention: (origin?.prevention || 0) | (data?.prevention || 0),
        };
      });
    });

    const common = cells?.['default'];
    for (let y = 0; y < auto.numRows + 1; y++) {
      const rowId = y2r(y);
      const rowDefault = cells?.[rowId];
      for (let x = 0; x < auto.numCols + 1; x++) {
        const id = this.getId({ y, x });
        const address = p2a({ y, x });
        const colId = x2c(x);
        const colDefault = cells?.[colId];
        const cell = cells?.[address];
        const stacked = {
          ...common,
          ...rowDefault,
          ...colDefault,
          ...cell,
          style: {
            ...common?.style,
            ...rowDefault?.style,
            ...colDefault?.style,
            ...cell?.style,
          },
          prevention:
            (common?.prevention || 0) |
            (rowDefault?.prevention || 0) |
            (colDefault?.prevention || 0) |
            (cell?.prevention || 0),
        } as CellType;

        if (stacked?.value?.startsWith?.('=')) {
          this.idsToBeIdentified.push(id);
        }
        if (y === 0) {
          if (stacked.width == null) {
            stacked.width = DEFAULT_WIDTH;
          }
        } else if (x === 0) {
          if (stacked.height == null) {
            stacked.height = DEFAULT_HEIGHT;
          }
        } else {
          delete stacked.height;
          delete stacked.width;
          delete stacked.labeler;
        }
        stacked.system = { id, changedAt, dependents: new Set(), sheetId: this.sheetId };
        this.wire.data[id] = stacked;
      }
    }
    this.status = 1; // initialized
    this.wire.sheetIdsByName[this.sheetName] = this.sheetId;
  }

  public incrementVersion() {
    this.version++;
    if (this.version >= Number.MAX_SAFE_INTEGER) {
      this.version = 1;
    }
  }

  private generateId() {
    return (this.wire.cellHead++).toString(36);
  }

  public getRectSize({ top, left, bottom, right }: AreaType) {
    let width = 0,
      height = 0;
    for (let x = left || 1; x < right; x++) {
      width += this.getCellByPoint({ y: 0, x }, 'SYSTEM')?.width || DEFAULT_WIDTH;
    }
    for (let y = top || 1; y < bottom; y++) {
      height += this.getCellByPoint({ y, x: 0 }, 'SYSTEM')?.height || DEFAULT_HEIGHT;
    }
    return { width, height };
  }

  public setTotalSize() {
    const { bottom, right } = this.area;
    const { width, height } = this.getRectSize({
      top: 1,
      left: 1,
      bottom: bottom + 1,
      right: right + 1,
    });
    this.totalWidth = width + this.headerWidth;
    this.totalHeight = height + this.headerHeight;
  }

  public refresh(relocate = false, resize = false): Table {
    this.incrementVersion();
    this.lastChangedAt = this.changedAt;
    this.changedAt = new Date();

    this.clearSolvedCaches();

    if (relocate) {
      // force reset
      this.addressCaches.clear();
    }
    if (resize) {
      this.setTotalSize();
    }
    return this;
  }

  public clone(relocate = false): Table {
    const copied: Table = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    return copied.refresh(relocate);
  }

  public getPointById(
    id: Id,
    slideY = 0,
    slideX = 0,
  ): PointType & {
    absCol: boolean;
    absRow: boolean;
  } {
    const absCol = id.startsWith('$');
    if (absCol) {
      id = id.slice(1);
      slideX = 0;
    }
    const absRow = id.endsWith('$');
    if (absRow) {
      id = id.slice(0, -1);
      slideY = 0;
    }
    const cache = this.addressCaches.get(id);
    if (cache) {
      const p = a2p(cache);
      return { y: p.y + slideY, x: p.x + slideX, absCol, absRow };
    }

    for (let y = 0; y < this.idMatrix.length; y++) {
      const ids = this.idMatrix[y];
      for (let x = 0; x < ids.length; x++) {
        const existing = ids[x];
        const address = p2a({ y, x });
        this.addressCaches.set(existing, address);
        if (existing === id) {
          return {
            y: y + slideY,
            x: x + slideX,
            absCol,
            absRow,
          };
        }
      }
    }
    return { y: -1, x: -1, absCol, absRow };
  }

  public getAddressById(id: Id, slideY = 0, slideX = 0): string | undefined {
    const { y, x, absCol, absRow } = this.getPointById(id, slideY, slideX);
    return grantAddressAbsolute(p2a({ y, x }), absCol, absRow);
  }

  public getAddressesByIds(ids: CellsByIdType) {
    const addresses: CellsByAddressType = {};
    Object.keys(ids).forEach((id) => {
      const cell = ids[id];
      const address = this.getAddressById(id);
      if (cell && address) {
        addresses[address] = cell;
      }
    });
    return addresses;
  }

  public clearAddressCaches() {
    this.addressCaches.clear();
  }

  public getId(point: PointType) {
    const { y, x } = point;
    return this.idMatrix[y]?.[x];
  }

  public getIdFormula(point: ExtraPointType): { id: Id | null; formula: string | null } {
    const { y, x, absX = false, absY = false } = point;
    const id = this.getId({ y, x });
    if (id == null) {
      return { id: null, formula: null };
    }
    return {
      id,
      formula: `${absX ? '$' : ''}#${id}${absY ? '$' : ''}`,
    };
  }

  public getCellByPoint(point: PointType, refEvaluation: RefEvaluation = 'COMPLETE', raise = false) {
    const { y, x } = point;
    if (y === -1 || x === -1) {
      return undefined;
    }
    const id = this.idMatrix[y]?.[x];
    if (id == null) {
      return undefined;
    }
    const cell = this.wire.data[id];
    if (cell == null) {
      return undefined;
    }
    const value = solveFormula({
      value: cell.value,
      table: this,
      raise,
      refEvaluation,
      origin: point,
    });
    return { ...cell, value } as CellType;
  }

  public getCellByAddress(address: Address, refEvaluation: RefEvaluation = 'COMPLETE', raise = false) {
    const point = a2p(address);
    return this.getCellByPoint(point, refEvaluation, raise);
  }

  public getById(id: Id) {
    return this.wire.data[id];
  }

  public getNumRows(base = 1) {
    const { top, bottom } = this.area;
    return base + bottom - top;
  }

  public getNumCols(base = 1) {
    const { left, right } = this.area;
    return base + right - left;
  }

  public get top() {
    return this.area.top;
  }
  public get left() {
    return this.area.left;
  }
  public get bottom() {
    return this.area.bottom;
  }
  public get right() {
    return this.area.right;
  }

  getFullRef(ref: Address) {
    if (this.sheetName) {
      return `#${this.sheetName}!${ref}`;
    }
    return ref;
  }

  public getFieldMatrix({
    area,
    field = 'value',
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
  }: GetFieldPropsWithArea = {}) {
    const { top, left, bottom, right } = area ?? this.area;
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          matrix[y - top][x - left] = cell[field];
        }
      }
    }
    return matrix;
  }

  public getFieldObject({
    area,
    field = 'value',
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
  }: GetFieldPropsWithArea = {}) {
    const result: { [Address: Address]: any } = {};
    const { top, left, bottom, right } = area ?? this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          result[p2a({ y, x })] = cell[field];
        }
      }
    }
    return result;
  }

  public getFieldRows({
    field = 'value',
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
  }: GetFieldProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsByAddressType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          row[x2c(x)] = cell[field];
        }
      }
    }
    return result;
  }

  public getFieldCols({
    field = 'value',
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
  }: GetFieldProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsByAddressType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          col[y2r(y)] = cell[field];
        }
      }
    }
    return result;
  }

  public getMatrix({
    area,
    refEvaluation = 'SYSTEM',
    raise = false,
    filter = noFilter,
  }: GetPropsWithArea = {}): (CellType | null)[][] {
    const { top, left, bottom, right } = area || {
      top: 1,
      left: 1,
      bottom: this.area.bottom,
      right: this.area.right,
    };
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          matrix[y - top][x - left] = cell;
        }
      }
    }
    return matrix;
  }
  public getObject({ refEvaluation = 'SYSTEM', area, raise = false, filter = noFilter }: GetPropsWithArea = {}) {
    const result: CellsByAddressType = {};
    const { top, left, bottom, right } = area || {
      top: 1,
      left: 1,
      bottom: this.area.bottom,
      right: this.area.right,
    };
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          result[p2a({ y, x })] = cell;
        }
      }
    }
    return result;
  }
  public getRows({ refEvaluation = 'COMPLETE', raise = false, filter = noFilter }: GetProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsByAddressType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y: y - top, x: x - left }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          row[x2c(x)] = cell;
        }
      }
    }
    return result;
  }
  public getCols({ refEvaluation = 'COMPLETE', raise = false, filter = noFilter }: GetProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsByAddressType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getCellByPoint({ y: y - top, x: x - left }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          col[y2r(y)] = cell;
        }
      }
    }
    return result;
  }

  private pushHistory(history: HistoryType) {
    const hub = this.wire;
    const strayedHistories = hub.histories.splice(hub.historyIndex + 1, hub.histories.length);
    strayedHistories.forEach(this.cleanStrayed.bind(this));
    hub.histories.push(history);
    hub.lastHistory = hub.currentHistory = history;
    if (hub.histories.length > hub.historyLimit) {
      const kickedOut = hub.histories.splice(0, 1)[0];
      this.cleanObsolete(kickedOut);
    } else {
      hub.historyIndex++;
    }
  }

  private cleanObsolete(history: HistoryType) {
    if (history.operation === 'REMOVE_ROWS' || history.operation === 'REMOVE_COLS') {
      history.deleted.forEach((ids) => {
        ids.forEach((id) => {
          delete this.wire.data[id];
        });
      });
    }
    if (history.operation === 'MOVE') {
      Object.keys(history.lostRows).forEach((address) => {
        const idMatrix = history.lostRows[address];
        idMatrix.map((ids) =>
          ids.forEach((id) => {
            if (id != null) {
              delete this.wire.data[id];
            }
          }),
        );
      });
    }
  }

  private cleanStrayed(history: HistoryType) {
    if (history.operation === 'INSERT_ROWS' || history.operation === 'INSERT_COLS') {
      history.idMatrix.forEach((ids) => {
        ids.forEach((id) => {
          delete this.wire.data[id];
        });
      });
    }
  }

  private getNewIdMatrix(area: AreaType) {
    const matrix: IdMatrix = [];
    const { top, left, bottom, right } = area;
    for (let y = top; y <= bottom; y++) {
      const ids: Ids = [];
      matrix.push(ids);
      for (let x = left; x <= right; x++) {
        ids.push(this.generateId());
      }
    }
    return matrix;
  }

  private getIdMatrixFromArea(area: AreaType) {
    const matrix: IdMatrix = [];
    const { top, left, bottom, right } = area;
    for (let y = top; y <= bottom; y++) {
      const ids: Ids = [];
      matrix.push(ids);
      for (let x = left; x <= right; x++) {
        const id = this.idMatrix[y]?.[x];
        if (id == null) {
          continue;
        }
        ids.push(id);
      }
    }
    return matrix;
  }

  private setChangedAt(cell?: CellType, changedAt?: Date) {
    if (cell?.system == null) {
      return null;
    }
    cell.system!.changedAt = changedAt ?? new Date();
    return cell;
  }

  private getUpdatedArea(diff: CellsByAddressType): AreaType {
    let minY = Infinity;
    let minX = Infinity;
    let maxY = -Infinity;
    let maxX = -Infinity;

    Object.keys(diff).forEach((address) => {
      const point = a2p(address);
      minY = Math.min(minY, point.y);
      minX = Math.min(minX, point.x);
      maxY = Math.max(maxY, point.y);
      maxX = Math.max(maxX, point.x);
    });

    return {
      top: minY,
      left: minX,
      bottom: maxY,
      right: maxX,
    };
  }

  private copyCellLayout(cell: CellType | undefined) {
    if (cell == null) {
      return undefined;
    }
    const newCell: CellType = {};
    if (cell.style != null) {
      newCell.style = cell.style;
    }
    if (cell.justifyContent != null) {
      newCell.justifyContent = cell.justifyContent;
    }
    if (cell.alignItems != null) {
      newCell.alignItems = cell.alignItems;
    }
    if (cell.renderer != null) {
      newCell.renderer = cell.renderer;
    }
    if (cell.parser != null) {
      newCell.parser = cell.parser;
    }
    if (cell.width != null) {
      newCell.width = cell.width;
    }
    if (cell.height != null) {
      newCell.height = cell.height;
    }
    if (cell.labeler != null) {
      newCell.labeler = cell.labeler;
    }
    return newCell;
  }

  public move({
    srcTable = this,
    src,
    dst,
    historicize = true,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: MoveProps) {
    const matrixNew = this.getNewIdMatrix(src);
    const matrixFrom = srcTable.__raw__.getIdMatrixFromArea(src);
    const matrixTo = this.getIdMatrixFromArea(dst);

    const diffBefore: CellsByIdType = {};
    const preserver = new ReferencePreserver(this);

    // to dst(to)
    const lostRows = putMatrix(this.idMatrix, matrixFrom, dst, ({ srcValue: srcId, dstValue: dstId }) => {
      if (srcId == null || dstId == null) {
        return false;
      }
      preserver.map[dstId] = srcId;
      preserver.addTheDependents(srcId, dstId);

      const srcCell = this.wire.data[srcId];
      const dstCell = this.wire.data[dstId];
      if (
        operator === 'USER' &&
        (operation.hasOperation(srcCell?.prevention, operation.MoveFrom) ||
          operation.hasOperation(dstCell?.prevention, operation.MoveTo))
      ) {
        return false;
      }
      const policy = this.policies[dstCell?.policy!] ?? defaultPolicy;
      const patch = policy.restrict({
        table: this,
        point: this.getPointById(dstId),
        patch: srcCell,
        original: dstCell,
        operation: operation.MoveTo,
      });
      if (patch) {
        diffBefore[srcId] = { ...srcCell };
        this.wire.data[srcId] = {
          ...srcCell,
          ...patch,
          system: {
            id: srcId,
            sheetId: this.sheetId,
            changedAt: new Date(),
            dependents: srcCell?.system?.dependents ?? new Set(),
          },
        };
      }
      if (srcCell != null) {
        this.setChangedAt(srcCell, new Date());
      }
      return true;
    });

    const srcTableRaw = srcTable.__raw__;
    const srcContext = this.wire.contextsBySheetId[srcTableRaw.sheetId];
    // to src(from)
    putMatrix(srcTableRaw.idMatrix, matrixNew, src, ({ srcValue: newId, dstValue: srcId, dstPoint: srcPoint }) => {
      // if the srcPoint is in the dst(Area), we do not need to rewrite
      if (among(dst, srcPoint) && srcTable === this) {
        return false;
      }
      preserver.map[srcId] = newId;
      const srcCell = srcTableRaw.wire.data[srcId];
      if (operator === 'USER' && operation.hasOperation(srcCell?.prevention, operation.MoveFrom)) {
        return false;
      }
      const policy = this.policies[srcCell?.policy!] ?? defaultPolicy;
      const patch = policy.restrict({
        table: srcTableRaw,
        point: srcTableRaw.getPointById(srcId),
        patch: undefined,
        original: srcCell,
        operation: operation.MoveFrom,
      });
      srcTableRaw.wire.data[newId] = {
        value: null,
        ...patch,
        system: {
          id: newId,
          sheetId: srcTableRaw.sheetId,
          changedAt: new Date(),
          dependents: srcCell?.system?.dependents ?? new Set(),
        },
      };
      return true;
    });

    const resolvedDiff = preserver.resolveDependents();
    Object.assign(diffBefore, resolvedDiff);
    if (srcTable !== this && srcContext !== null) {
      const { dispatch } = srcContext;
      requestAnimationFrame(() => {
        dispatch(updateTable(srcTableRaw));
      });
    }

    if (historicize) {
      this.pushHistory({
        applyed: true,
        operation: 'MOVE',
        srcSheetId: srcTableRaw.sheetId,
        dstSheetId: this.sheetId,
        undoReflection,
        redoReflection,
        diffBefore,
        diffAfter: {},
        src,
        dst,
        matrixFrom,
        matrixTo,
        matrixNew,
        lostRows,
      });
    }

    // Call onEdit with cloned tables containing moved areas
    if (this.wire.onEdit) {
      // Clone srcTable with from area
      this.wire.onEdit({ table: srcTable.__raw__.trim(src) });
      this.wire.onEdit({ table: this.__raw__.trim(dst) });
    }

    return this.refresh(true);
  }

  public copy({
    srcTable = this,
    src,
    dst,
    onlyValue = false,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: MoveProps & { onlyValue?: boolean }) {
    const isXSheet = srcTable !== this;
    const { height: maxHeight, width: maxWidth } = areaShape({ ...src, base: 1 });
    const { top: topFrom, left: leftFrom } = src;
    const { top: topTo, left: leftTo, bottom: bottomTo, right: rightTo } = dst;
    const diff: CellsByAddressType = {};
    const changedAt = new Date();

    for (let i = 0; i <= bottomTo - topTo; i++) {
      const toY = topTo + i;
      if (toY > this.getNumRows()) {
        continue;
      }
      for (let j = 0; j <= rightTo - leftTo; j++) {
        const toX = leftTo + j;
        if (toX > this.getNumCols()) {
          continue;
        }
        const fromY = topFrom + (i % maxHeight);
        const fromX = leftFrom + (j % maxWidth);
        const slideY = isXSheet ? 0 : toY - fromY;
        const slideX = isXSheet ? 0 : toX - fromX;
        const cell: CellType = {
          ...srcTable.getCellByPoint(
            {
              y: topFrom + (i % maxHeight),
              x: leftFrom + (j % maxWidth),
            },
            'SYSTEM',
          ),
        };
        const dstPoint = { y: toY, x: toX };
        const value = identifyFormula(cell?.value, {
          table: this,
          dependency: this.getId(dstPoint),
          slideY,
          slideX,
        });
        this.setChangedAt(cell, changedAt);
        const address = p2a(dstPoint);
        if (onlyValue) {
          const dstCell = this.getCellByPoint(dstPoint, 'SYSTEM');
          cell.style = dstCell?.style;
          cell.justifyContent = dstCell?.justifyContent;
          cell.alignItems = dstCell?.alignItems;
        }
        diff[address] = { ...cell, value };
      }
    }
    return this.update({
      diff,
      partial: false,
      operator,
      operation: operation.Copy,
      undoReflection,
      redoReflection,
    });
  }

  public getPolicyByPoint(point: PointType): PolicyType {
    const cell = this.getCellByPoint(point, 'SYSTEM');
    if (cell?.policy == null) {
      return defaultPolicy;
    }
    return this.policies[cell.policy] ?? defaultPolicy;
  }

  private _update({
    diff,
    partial = true,
    updateChangedAt = true,
    ignoreFields = ['labeler'],
    operator = 'SYSTEM',
    operation: op = operation.Update,
    formulaIdentify = true,
  }: {
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    ignoreFields?: (keyof CellType)[];
    operator?: OperatorType;
    operation?: OperationType;
    formulaIdentify?: boolean;
  }) {
    const diffBefore: CellsByIdType = {};
    const diffAfter: CellsByIdType = {};
    const changedAt = new Date();

    let resized = false;
    Object.keys(diff).forEach((address) => {
      const point = a2p(address);
      const id = this.getId(point);
      const original = this.wire.data[id]!;
      if (operator === 'USER' && operation.hasOperation(original.prevention, operation.Update)) {
        return;
      }

      let patch: Record<string, any> = { ...diff[address] };

      if (formulaIdentify) {
        patch.value = identifyFormula(patch.value, {
          table: this,
          dependency: id,
        });
      }
      ignoreFields.forEach((key) => {
        patch[key] = original?.[key];
      });
      if (operator === 'USER' && operation.hasOperation(original?.prevention, operation.Write)) {
        delete patch.value;
      }
      if (operator === 'USER' && operation.hasOperation(original?.prevention, operation.Style)) {
        delete patch?.style?.justifyContent;
        delete patch?.style?.alignItems;
      }
      if (operator === 'USER' && operation.hasOperation(original?.prevention, operation.Resize)) {
        delete patch?.style?.width;
        delete patch?.style?.height;
      }
      if (operator === 'USER' && operation.hasOperation(original?.prevention, operation.SetRenderer)) {
        delete patch?.renderer;
      }
      if (operator === 'USER' && operation.hasOperation(original?.prevention, operation.SetParser)) {
        delete patch?.parser;
      }
      if (updateChangedAt) {
        this.setChangedAt(patch, changedAt);
      }
      if (patch.width != null || patch.height != null) {
        resized = true;
      }
      // must not partial
      diffBefore[id] = { ...original };

      const policy = this.policies[original.policy!] ?? defaultPolicy;
      const p = policy.restrict({
        table: this,
        point,
        patch,
        original,
        operation: op,
      });
      patch = { ...p, system: { ...original.system!, changedAt } };
      if (partial) {
        diffAfter[id] = this.wire.data[id] = { ...original, ...patch };
      } else {
        diffAfter[id] = this.wire.data[id] = patch;
      }
    });

    // Call onEdit with cloned table containing updated area
    if (this.wire.onEdit && Object.keys(diff).length > 0) {
      const updatedArea = this.getUpdatedArea(diff);
      this.wire.onEdit({ table: this.__raw__.trim(updatedArea) });
    }

    //this.clearSolvedCaches();
    return {
      diffBefore,
      diffAfter,
      resized,
    };
  }

  public update({
    diff,
    partial = true,
    updateChangedAt = true,
    historicize = true,
    operator = 'SYSTEM',
    operation: op = operation.Update,
    undoReflection,
    redoReflection,
  }: {
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    historicize?: boolean;
    operator?: OperatorType;
    operation?: OperationType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const { diffBefore, diffAfter, resized } = this._update({
      diff,
      partial,
      operator,
      operation: op,
      updateChangedAt,
    });

    if (historicize) {
      this.pushHistory({
        applyed: true,
        operation: 'UPDATE',
        srcSheetId: this.sheetId,
        dstSheetId: this.sheetId,
        undoReflection,
        redoReflection,
        diffBefore,
        diffAfter,
        partial,
      });
    }
    return this.refresh(false, resized);
  }

  public writeRawCellMatrix({
    point,
    matrix,
    updateChangedAt = true,
    historicize = true,
    onlyValue = false,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    point: PointType;
    matrix: MatrixType<RawCellType>;
    updateChangedAt?: boolean;
    historicize?: boolean;
    onlyValue?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const { y: baseY, x: baseX } = point;
    const diff: CellsByAddressType = {};
    matrix.forEach((cells, i) => {
      const y = baseY + i;
      if (y > this.bottom) {
        return;
      }
      cells.forEach((newCell, j) => {
        const x = baseX + j;
        if (x > this.right) {
          return;
        }

        const point = { y, x };
        const parsed = this.parse(point, newCell.value ?? '');
        parsed.style = { ...newCell.style, ...parsed.style };
        if (onlyValue) {
          const currentCell = this.getCellByPoint(point, 'SYSTEM');
          parsed.style = currentCell?.style;
          parsed.justifyContent = currentCell?.justifyContent;
          parsed.alignItems = currentCell?.alignItems;
        }
        diff[p2a(point)] = parsed;
      });
    });
    return this.update({
      diff,
      partial: true,
      updateChangedAt,
      historicize,
      operator,
      operation: operation.Write,
      undoReflection,
      redoReflection,
    });
  }

  public writeMatrix(props: {
    point: PointType;
    matrix: MatrixType<string>;
    updateChangedAt?: boolean;
    historicize?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const matrixWithStyle: MatrixType<RawCellType> = props.matrix.map((row) => row.map((value) => ({ value })));
    return this.writeRawCellMatrix({ ...props, matrix: matrixWithStyle });
  }

  public write(props: {
    point: PointType;
    value: string;
    updateChangedAt?: boolean;
    historicize?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const { point, value } = props;
    const parsed = this.parse(point, value ?? '');
    const current = this.getCellByPoint(point, 'RAW');
    if (current?.value === parsed.value) {
      // no change
      return this;
    }
    const diff = { [p2a(point)]: parsed };
    return this.update({
      ...props,
      diff,
      partial: true,
      operation: operation.Write,
    });
  }

  public insertRows({
    y,
    numRows,
    baseY,
    diff,
    partial,
    updateChangedAt,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    y: number;
    numRows: number;
    baseY: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    if (this.maxNumRows !== -1 && this.getNumRows() + numRows > this.maxNumRows) {
      console.error(`Rows are limited to ${this.maxNumRows}.`);
      return this;
    }
    const numCols = this.getNumCols(1);
    const rows: IdMatrix = [];
    const changedAt = new Date();
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.generateId();
        row.push(id);
        const cell = this.getCellByPoint({ y: baseY, x: j }, 'SYSTEM');
        const copied = this.copyCellLayout(cell);
        this.wire.data[id] = {
          ...copied,
          system: {
            id,
            sheetId: this.sheetId,
            changedAt,
            dependents: new Set(),
          },
        };
      }
      rows.push(row);
    }
    this.idMatrix.splice(y, 0, ...rows);
    this.area.bottom += numRows;

    this.pushHistory({
      applyed: true,
      operation: 'INSERT_ROWS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection,
      redoReflection,
      y,
      numRows,
      idMatrix: rows,
    });

    // If diff is provided, update the cells after insertion
    if (diff) {
      Object.assign(this.wire.lastHistory!, this._update({ diff, partial, updateChangedAt, operator }), { partial });
    }
    if (this.wire.onInsertRows) {
      const cloned = this.clone();
      cloned.area = {
        top: y,
        bottom: y + numRows - 1,
        left: this.area.left,
        right: this.area.right,
      };
      cloned.addressCaches = new Map();
      this.wire.onInsertRows({ table: cloned, y, numRows });
    }
    return this.refresh(true, true);
  }
  public removeRows({
    y,
    numRows,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    y: number;
    numRows: number;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    if (this.minNumRows !== -1 && this.getNumRows() - numRows < this.minNumRows) {
      console.error(`At least ${this.minNumRows} row(s) are required.`);
      return this;
    }

    const preserver = new ReferencePreserver(this);
    const ys: number[] = [];
    const backup = this.idMatrix.map((ids) => [...ids]); // backup before deletion

    for (let yi = y; yi < y + numRows; yi++) {
      const cell = this.getCellByPoint({ y: yi, x: 0 }, 'SYSTEM');
      if (operator === 'USER' && operation.hasOperation(cell?.prevention, operation.RemoveRows)) {
        console.warn(`Cannot delete row ${yi}.`);
        return this;
      }
      for (let xi = 1; xi <= this.getNumCols(); xi++) {
        const id = this.getId({ y: yi, x: xi });
        if (id == null) {
          continue;
        }
        preserver.addTheDependents(id);
        preserver.map[id] = this.getId({ y: yi + numRows, x: xi });
      }
      ys.unshift(yi);
    }
    const deleted: MatrixType = [];
    ys.forEach((y) => {
      const row = this.idMatrix.splice(y, 1);
      deleted.unshift(row[0]);
    });
    this.area.bottom -= ys.length;

    const diffBefore = preserver.resolveDependents('removeRows');

    this.pushHistory({
      applyed: true,
      operation: 'REMOVE_ROWS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection,
      redoReflection,
      ys: ys.reverse(),
      diffBefore,
      deleted,
    });

    if (this.wire.onRemoveRows) {
      const cloned = this.clone();
      cloned.idMatrix = backup;
      cloned.area = {
        top: y,
        bottom: y + numRows - 1,
        left: this.area.left,
        right: this.area.right,
      };
      cloned.addressCaches = new Map();
      this.wire.onRemoveRows({ table: cloned, ys: ys.reverse() });
    }
    return this.refresh(true, true);
  }

  public insertCols({
    x,
    numCols,
    baseX,
    diff,
    partial,
    updateChangedAt,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    x: number;
    numCols: number;
    baseX: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    if (this.maxNumCols !== -1 && this.getNumCols() + numCols > this.maxNumCols) {
      console.error(`Columns are limited to ${this.maxNumCols}.`);
      return this;
    }
    const numRows = this.getNumRows(1);
    const rows: IdMatrix = [];
    const changedAt = new Date();
    for (let i = 0; i <= numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.generateId();
        row.push(id);
        const cell = this.getCellByPoint({ y: i, x: baseX }, 'SYSTEM');
        const copied = this.copyCellLayout(cell);
        this.idMatrix[i].splice(x, 0, id);
        this.wire.data[id] = {
          ...copied,
          system: {
            id,
            sheetId: this.sheetId,
            changedAt,
            dependents: new Set(),
          },
        };
      }
      rows.push(row);
    }
    this.area.right += numCols;

    this.pushHistory({
      applyed: true,
      operation: 'INSERT_COLS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection: undoReflection,
      redoReflection: redoReflection,
      x,
      numCols,
      idMatrix: rows,
    });

    // If diff is provided, update the cells after insertion
    if (diff) {
      Object.assign(this.wire.lastHistory!, this._update({ diff, partial, updateChangedAt, operator }), { partial });
    }
    if (this.wire.onInsertCols) {
      const cloned = this.clone();
      cloned.area = {
        top: this.area.top,
        bottom: this.area.bottom,
        left: x,
        right: x + numCols - 1,
      };
      cloned.addressCaches = new Map();
      this.wire.onInsertCols({ table: cloned, x, numCols });
    }
    return this.refresh(true, true);
  }
  public removeCols({
    x,
    numCols,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    x: number;
    numCols: number;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    if (this.minNumCols !== -1 && this.getNumCols() - numCols < this.minNumCols) {
      console.error(`At least ${this.minNumCols} column(s) are required.`);
      return this;
    }

    const preserver = new ReferencePreserver(this);
    const xs: number[] = [];
    const backup = this.idMatrix.map((ids) => [...ids]); // backup before deletion

    for (let xi = x; xi < x + numCols; xi++) {
      const cell = this.getCellByPoint({ y: 0, x: xi }, 'SYSTEM');
      if (operator === 'USER' && operation.hasOperation(cell?.prevention, operation.RemoveCols)) {
        console.warn(`Cannot delete col ${xi}.`);
        continue;
      }
      for (let yi = 1; yi <= this.getNumRows(); yi++) {
        const id = this.getId({ y: yi, x: xi });
        if (id == null) {
          continue;
        }
        preserver.addTheDependents(id);
        preserver.map[id] = this.getId({ y: yi, x: xi + numCols });
      }
      xs.unshift(xi);
    }

    const deleted: MatrixType = [];
    this.idMatrix.forEach((row) => {
      const deleting: Ids = [];
      deleted.push(deleting);
      // reverse and delete
      xs.forEach((x) => {
        deleting.unshift(...row.splice(x, 1));
      });
    });
    this.area.right -= xs.length;
    const diffBefore = preserver.resolveDependents('removeCols');

    this.pushHistory({
      applyed: true,
      operation: 'REMOVE_COLS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection: undoReflection,
      redoReflection: redoReflection,
      xs: xs.reverse(),
      diffBefore,
      deleted,
    });

    if (this.wire.onRemoveCols) {
      const cloned = this.clone();
      cloned.idMatrix = backup;
      cloned.area = {
        top: this.area.top,
        bottom: this.area.bottom,
        left: x,
        right: x + numCols - 1,
      };
      cloned.addressCaches = new Map();
      this.wire.onRemoveCols({ table: cloned, xs: xs.reverse() });
    }
    return this.refresh(true, true);
  }
  public getHistories() {
    return [...this.wire.histories];
  }
  public getHistoryIndex() {
    return this.wire.historyIndex;
  }
  public getHistorySize() {
    return this.wire.histories.length;
  }
  public getHistoryLimit() {
    return this.wire.historyLimit;
  }

  public getArea(): AreaType {
    return { ...this.area };
  }

  public parse(point: PointType, value: string) {
    const cell = this.getCellByPoint(point, 'SYSTEM') ?? {};
    const parser = this.parsers[cell.parser ?? ''] ?? defaultParser;
    return parser.call(value, cell);
  }

  public render(props: RendererCallProps) {
    const { point, sync } = props;
    const cell = this.getCellByPoint(point, 'SYSTEM') ?? {};
    const renderer = this.renderers[cell.renderer ?? ''] ?? defaultRenderer;
    return renderer.call({ table: this, point, sync });
  }

  public stringify({
    point,
    cell,
    refEvaluation = 'COMPLETE',
  }: {
    point: PointType;
    cell?: CellType;
    refEvaluation?: RefEvaluation;
  }) {
    if (cell == null) {
      cell = this.getCellByPoint(point, refEvaluation, true);
    }
    if (cell == null) {
      return '';
    }
    const renderer = this.renderers[cell?.renderer ?? ''] ?? defaultRenderer;
    const s = renderer.stringify({ value: cell.value, cell, table: this, point });

    if (s[0] === '=') {
      if (refEvaluation === 'SYSTEM') {
        return s; // do not evaluate system references
      }
      if (refEvaluation === 'RAW') {
        const lexer = new Lexer(s.substring(1));
        lexer.tokenize();
        return '=' + lexer.display({ table: this });
      }
      const solved = solveFormula({ value: s, table: this, raise: false, refEvaluation, origin: point });
      const value = stripTable({ value: solved, raise: false });
      return renderer.stringify({ value, cell, table: this, point });
    }
    return s;
  }

  public trim(area: AreaType): Table {
    const copied: Table = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    copied.area = area;
    // this causes RangeError on circular reference(maximum call stack size exceeded)
    // copied.solvedCaches = {};
    return copied;
  }

  private applyDiff(diff: CellsByIdType = {}, partial = true) {
    if (!partial) {
      //Object.assign(this.wire.data, diff);
      Object.keys(diff).forEach((id) => {
        const cell = diff[id] ?? {};
        this.setChangedAt(cell);
        this.wire.data[id] = { ...cell };
      });
      return;
    }
    Object.keys(diff).map((id) => {
      const cell = diff[id] ?? {};
      this.setChangedAt(cell);
      this.wire.data[id] = { ...this.getById(id), ...cell };
    });
  }

  public undo() {
    if (this.wire.historyIndex < 0) {
      return { history: null, newTable: this.__raw__ };
    }
    const history = this.wire.histories[this.wire.historyIndex--];
    history.applyed = false;
    this.wire.currentHistory = this.wire.histories[this.wire.historyIndex];

    const srcTable = this.getTableBySheetId(history.srcSheetId);
    const dstTable = this.getTableBySheetId(history.dstSheetId);

    if (!dstTable) {
      return { history: null, newTable: this.__raw__ };
    }

    switch (history.operation) {
      case 'UPDATE':
        dstTable.applyDiff(history.diffBefore, false);
        break;
      case 'INSERT_ROWS': {
        if (history.diffBefore) {
          dstTable.applyDiff(history.diffBefore, history.partial);
        }
        const { height } = matrixShape({ matrix: history.idMatrix });
        dstTable.idMatrix.splice(history.y, height);
        dstTable.area.bottom -= height;
        break;
      }
      case 'INSERT_COLS': {
        if (history.diffBefore) {
          dstTable.applyDiff(history.diffBefore, false);
        }
        const { width } = matrixShape({ matrix: history.idMatrix });
        dstTable.idMatrix.forEach((row) => {
          row.splice(history.x, width);
        });
        dstTable.area.right -= width;
        break;
      }
      case 'REMOVE_ROWS': {
        const { ys, deleted } = history;
        ys.forEach((y, i) => {
          dstTable.idMatrix.splice(y, 0, deleted[i]);
        });
        dstTable.area.bottom += ys.length;
        this.applyDiff(history.diffBefore, false);
        break;
      }
      case 'REMOVE_COLS': {
        const { xs, deleted } = history;
        dstTable.idMatrix.forEach((row, i) => {
          for (let j = 0; j < xs.length; j++) {
            row.splice(xs[j], 0, deleted[i][j]);
          }
        });
        dstTable.area.right += xs.length;
        this.applyDiff(history.diffBefore, false);
        break;
      }
      case 'MOVE': {
        const { top: yFrom, left: xFrom } = history.src;
        const { top: yTo, left: xTo } = history.dst;
        const { height: rows, width: cols } = matrixShape({
          matrix: history.matrixFrom,
          base: -1,
        });
        if (srcTable) {
          putMatrix(srcTable.idMatrix, history.matrixFrom, {
            top: yFrom,
            left: xFrom,
            bottom: yFrom + rows,
            right: xFrom + cols,
          });
        }
        putMatrix(dstTable.idMatrix, history.matrixTo, {
          top: yTo,
          left: xTo,
          bottom: yTo + rows,
          right: xTo + cols,
        });
        // Restore original cell states
        dstTable.applyDiff(history.diffBefore, false);
        // Restore original formulas
        if (history.diffAfter) {
          dstTable.applyDiff(history.diffAfter, false);
        }
        break;
      }
    }
    this.refresh(shouldTracking(history.operation), true);
    return {
      history,
      callback: ({ tableReactive: tableRef }: StoreType) => {
        tableRef.current?.wire.transmit(history.undoReflection?.transmit);
      },
    };
  }

  public redo() {
    if (this.wire.historyIndex + 1 >= this.wire.histories.length) {
      return { history: null, newTable: this.__raw__ };
    }
    const history = this.wire.histories[++this.wire.historyIndex];
    history.applyed = true;
    this.wire.currentHistory = history;

    const srcTable = this.getTableBySheetId(history.srcSheetId);
    const dstTable = this.getTableBySheetId(history.dstSheetId);

    if (!dstTable) {
      return { history: null, newTable: this.__raw__ };
    }

    switch (history.operation) {
      case 'UPDATE':
        dstTable.applyDiff(history.diffAfter, history.partial);
        break;
      case 'INSERT_ROWS': {
        if (history.diffAfter) {
          dstTable.applyDiff(history.diffAfter, history.partial);
        }
        const { height } = matrixShape({ matrix: history.idMatrix });
        dstTable.idMatrix.splice(history.y, 0, ...history.idMatrix);
        dstTable.area.bottom += height;
        break;
      }
      case 'INSERT_COLS': {
        if (history.diffAfter) {
          dstTable.applyDiff(history.diffAfter, history.partial);
        }
        const { width } = matrixShape({ matrix: history.idMatrix });
        dstTable.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        dstTable.area.right += width;
        break;
      }
      case 'REMOVE_ROWS': {
        dstTable.removeRows({
          y: history.ys[0],
          numRows: history.ys.length,
          operator: 'SYSTEM',
          undoReflection: history.undoReflection,
          redoReflection: history.redoReflection,
        });
        break;
      }
      case 'REMOVE_COLS': {
        dstTable.removeCols({
          x: history.xs[0],
          numCols: history.xs.length,
          operator: 'SYSTEM',
          undoReflection: history.undoReflection,
          redoReflection: history.redoReflection,
        });
        break;
      }
      case 'MOVE': {
        const { src, dst } = history;
        if (srcTable) {
          dstTable.move({ srcTable, src, dst, operator: 'USER', historicize: false });
        }
      }
    }
    this.refresh(shouldTracking(history.operation), true);
    return {
      history,
      callback: ({ tableReactive: tableRef }: StoreType) => {
        tableRef.current?.wire.transmit(history.redoReflection?.transmit);
      },
    };
  }
  public getFunction(name: string) {
    return this.functions[name];
  }

  public getLabel(key: string | undefined, n: number) {
    if (key == null) {
      return null;
    }
    const labeler = this.labelers[key];
    return labeler?.(n);
  }
  public getBase() {
    return this;
  }

  public getSolvedCache(point: PointType) {
    const id = this.getId(point);
    return this.wire.solvedCaches.get(id);
  }
  public setSolvedCache(point: PointType, value: any) {
    const id = this.getId(point);
    this.wire.solvedCaches.set(id, value);
  }
  public clearSolvedCaches() {
    this.wire.solvedCaches.clear();
  }
  public sheetPrefix(omit = false) {
    if (omit) {
      return '';
    }
    return getSheetPrefix(this.sheetName);
  }
  public rangeToArea(range: string) {
    const cells = range.split(':');
    let [start, end] = cells;
    if (start.match(/[a-zA-Z]$/)) {
      start += '1';
    }
    if (start.match(/^[1-9]/)) {
      start = `A${start}`;
    }
    if (end?.match(/[a-zA-Z]$/)) {
      end += this.bottom;
    }
    if (end?.match(/^[1-9]/)) {
      end = `${x2c(this.right)}${end}`;
    }
    const { y: top, x: left } = a2p(start);
    const { y: bottom, x: right } = a2p(end || start);
    return {
      top: Math.abs(top),
      left: Math.abs(left),
      bottom: Math.abs(bottom),
      right: Math.abs(right),
    };
  }

  get __raw__(): Table {
    return this;
  }
}
