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
  Labelers,
  MatrixType,
  CellType,
  Parsers,
  Renderers,
  HistoryType,
  StorePatchType,
  ShapeType,
  OperatorType,
  OperationType,
  Policies,
  RawCellType,
  ExtraPointType,
  StoreType,
} from '../types';
import { areaShape, createMatrix, expandRange, getMaxSizesFromCells, matrixShape, putMatrix } from './structs';
import { a2p, x2c, p2a, y2r, grantAddressAbsolute } from './converters';
import { FunctionMapping } from '../formula/functions/__base';
import { functions as functionsDefault } from '../formula/mapping';
import { identifyFormula, Lexer, splitRef, stripSheetName } from '../formula/evaluator';
import { solveFormula } from '../formula/solver';

import { DEFAULT_HEIGHT, DEFAULT_WIDTH, HEADER_HEIGHT, HEADER_WIDTH, DEFAULT_HISTORY_LIMIT } from '../constants';
import { shouldTracking } from '../store/helpers';
import { updateTable } from '../store/actions';
import * as operation from './operation';
import { Hub, createHub } from './hub';
import { safeQueueMicrotask } from './time';
import { defaultPolicy, PolicyType } from '../policy/core';
import { escapeSheetName, getSheetPrefix } from './sheet';

type Props = {
  parsers?: Parsers;
  renderers?: Renderers;
  labelers?: Labelers;
  policies?: Policies;
  historyLimit?: number;
  minNumRows?: number;
  maxNumRows?: number;
  minNumCols?: number;
  maxNumCols?: number;
  headerHeight?: number;
  headerWidth?: number;
  functions?: FunctionMapping;
  sheetName?: string;
  hub?: Hub;
};

const noFilter: CellFilter = () => true;

type GetProps = {
  // null for the system, do not use it
  evaluates?: boolean | null;
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
  key?: keyof CellType;
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
  totalWidth: number;
  totalHeight: number;
  headerWidth: number;
  headerHeight: number;
  currentHistory?: HistoryType;

  __raw__: Table;

  getRectSize(area: AreaType): ShapeType;
  getAddressById(id: Id, slideY: number, slideX: number): string | undefined;
  getAddressesByIds(ids: CellsByIdType): CellsByAddressType;
  getPointById(id: Id): PointType;
  getByPoint(point: PointType): CellType | undefined;
  getId(point: PointType): Id;
  getById(id: Id): CellType | undefined;
  getNumRows(base?: number): number;
  getNumCols(base?: number): number;
  getFieldMatrix(args?: GetFieldPropsWithArea): any[][];
  getFieldObject(args?: GetFieldProps): CellsByAddressType;
  getFieldRows(args?: GetFieldProps): CellsByAddressType[];
  getFieldCols(args?: GetFieldProps): CellsByAddressType[];
  getMatrix(args?: GetPropsWithArea): (CellType | null)[][];
  getObject(args?: GetProps): CellsByAddressType;
  getRows(args?: GetProps): CellsByAddressType[];
  getCols(args?: GetProps): CellsByAddressType[];
  getTableBySheetName(sheetName: string): UserTable;
  getSheetId(): number;
  getHistories(): HistoryType[];
  move(args: MoveProps): UserTable;
  copy(args: MoveProps & { onlyValue?: boolean }): UserTable;
  update(args: {
    diff: CellsByAddressType;
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
  addRowsAndUpdate(args: {
    y: number;
    numRows: number;
    baseY: number;
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StorePatchType;
  }): UserTable;
  addRows(args: { y: number; numRows: number; baseY: number; reflection?: StorePatchType }): UserTable;
  deleteRows(args: { y: number; numRows: number; reflection?: StorePatchType }): UserTable;
  addColsAndUpdate(args: {
    x: number;
    numCols: number;
    baseX: number;
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StorePatchType;
  }): UserTable;
  addCols(args: { x: number; numCols: number; baseX: number; reflection?: StorePatchType }): UserTable;
  deleteCols(args: { x: number; numCols: number; reflection?: StorePatchType }): UserTable;
  undo(): {
    history: HistoryType | null;
    newTable: UserTable;
  };
  redo(): {
    history: HistoryType | null;
    newTable: UserTable;
  };
  getHistories(): HistoryType[];
  getHistoryIndex(): number;
  getHistorySize(): number;
  stringify(props: { point: PointType; cell?: CellType; evaluates?: boolean }): string;
}

export class Table implements UserTable {
  public changedAt: Date;
  public lastChangedAt?: Date;
  public minNumRows: number;
  public maxNumRows: number;
  public minNumCols: number;
  public maxNumCols: number;
  public totalWidth: number = 0;
  public totalHeight: number = 0;
  public headerWidth: number = 0;
  public headerHeight: number = 0;
  public sheetId: number = 0;
  public sheetName: string = '';
  public prevSheetName: string = '';
  public status: 0 | 1 | 2 = 0; // 0: not initialized, 1: initialized, 2: formula absoluted
  public hub: Hub;
  public idsToBeAbsoluted: Id[] = [];

  private version = 0;
  private idMatrix: IdMatrix;
  private area: AreaType = { top: 0, left: 0, bottom: 0, right: 0 };
  private parsers: Parsers;
  private renderers: Renderers;
  private labelers: Labelers;
  private policies: Policies;
  private functions: FunctionMapping = {};
  private addressCaches: Map<Id, Address> = new Map();

  constructor({
    parsers = {},
    renderers = {},
    labelers = {},
    policies = {},
    minNumRows = 1,
    maxNumRows = -1,
    minNumCols = 1,
    maxNumCols = -1,
    headerWidth = HEADER_WIDTH,
    headerHeight = HEADER_HEIGHT,
    functions = functionsDefault,
    sheetName,
    hub = createHub(),
  }: Props) {
    this.parsers = parsers || {};
    this.renderers = renderers || {};
    this.labelers = labelers || {};
    this.policies = policies || {};
    this.idMatrix = [];
    this.changedAt = new Date();
    this.minNumRows = minNumRows || 0;
    this.maxNumRows = maxNumRows || 0;
    this.minNumCols = minNumCols || 0;
    this.maxNumCols = maxNumCols || 0;
    this.headerHeight = headerHeight;
    this.headerWidth = headerWidth;
    this.functions = functions;
    this.sheetName = sheetName || '';
    this.hub = hub;
  }

  get isInitialized() {
    return this.version > 0;
  }

  public identifyFormula() {
    this.idsToBeAbsoluted.forEach((id) => {
      const cell = this.hub.data[id];
      if (cell?.system?.sheetId == null) {
        return;
      }
      cell.value = identifyFormula({
        value: cell?.value,
        table: this,
        originPath: id,
      });
    });
    this.idsToBeAbsoluted = [];
    this.status = 2;
  }

  public getSheetId() {
    return this.sheetId;
  }

  public getTableBySheetName(sheetName: string) {
    const sheetId = this.hub.sheetIdsByName[sheetName];
    return this.getTableBySheetId(sheetId);
  }
  public getTableBySheetId(sheetId: number) {
    return this.hub.contextsBySheetId[sheetId]?.store?.table;
  }

  public initialize(cells: CellsByAddressType) {
    if (this.status > 1) {
      return;
    }
    const auto = getMaxSizesFromCells(cells);
    const changedAt = new Date();
    this.area = {
      top: 0,
      left: 0,
      bottom: auto.numRows || 0,
      right: auto.numCols || 0,
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
          this.idsToBeAbsoluted.push(id);
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
        this.hub.data[id] = stacked;
      }
    }
    this.setTotalSize();
    this.status = 1; // initialized
    this.hub.sheetIdsByName[this.sheetName] = this.sheetId;
  }

  public incrementVersion() {
    this.version++;
    if (this.version >= Number.MAX_SAFE_INTEGER) {
      this.version = 1;
    }
  }

  private generateId() {
    return (this.hub.cellHead++).toString(36);
  }

  public getRectSize({ top, left, bottom, right }: AreaType) {
    let width = 0,
      height = 0;
    for (let x = left || 1; x < right; x++) {
      width += this.getByPoint({ y: 0, x })?.width || DEFAULT_WIDTH;
    }
    for (let y = top || 1; y < bottom; y++) {
      height += this.getByPoint({ y, x: 0 })?.height || DEFAULT_HEIGHT;
    }
    return { width, height };
  }
  private setTotalSize() {
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

  public clone(keepAddressCache = true) {
    this.incrementVersion();
    const copied: Table = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    copied.changedAt = new Date();
    copied.lastChangedAt = this.changedAt;
    copied.setTotalSize();
    copied.clearSolvedCaches();

    if (!keepAddressCache) {
      // force reset
      copied.addressCaches.clear();
    }
    return copied;
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
    return { y: 0, x: 0, absCol, absRow };
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

  public getByPoint(point: PointType) {
    const { y, x } = point;
    if (y === -1 || x === -1) {
      return undefined;
    }
    const id = this.idMatrix[y]?.[x];
    if (id == null) {
      return undefined;
    }
    const value = this.hub.data[id];
    return value;
  }

  public getById(id: Id) {
    return this.hub.data[id];
  }

  public getPathById(id: Id) {
    return `${this.sheetId}/${id}`;
  }

  public getByPath(path: string) {
    let [sheetId, id] = path.split('/');
    const table = this.getTableBySheetId(Number(sheetId));
    let cell = table?.getById(id);
    if (cell == null) {
      cell = { system: { id, changedAt: new Date(), dependents: new Set() } } as CellType;
    }
    return cell;
  }

  public getNumRows(base = 0) {
    const { top, bottom } = this.area;
    return base + bottom - top;
  }

  public getNumCols(base = 0) {
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
    key = 'value',
    evaluates = true,
    raise = false,
    filter = noFilter,
  }: GetFieldPropsWithArea = {}) {
    const { top, left, bottom, right } = area || {
      top: 1,
      left: 1,
      bottom: this.area.bottom,
      right: this.area.right,
    };
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y, x }) || {};
        if (!filter(cell)) {
          continue;
        }
        matrix[y - top][x - left] = solveFormula({
          value: cell[key],
          table: this,
          raise,
          evaluates,
          origin: { y, x },
        });
      }
    }
    return matrix;
  }

  public getFieldObject({ key = 'value', evaluates = true, raise = false, filter = noFilter }: GetFieldProps = {}) {
    const result: CellsByAddressType = {};
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          result[p2a({ y, x })] = solveFormula({
            value: cell[key],
            table: this,
            raise,
            evaluates,
            origin: { y, x },
          });
        }
      }
    }
    return result;
  }

  public getFieldRows({ key = 'value', evaluates = true, raise = false, filter = noFilter }: GetFieldProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsByAddressType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          row[x2c(x) || y2r(y)] = solveFormula({
            value: cell[key],
            table: this,
            raise,
            evaluates,
            origin: { y, x },
          });
        }
      }
    }
    return result;
  }

  public getFieldCols({ key = 'value', evaluates = true, raise = false, filter = noFilter }: GetFieldProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsByAddressType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          col[y2r(y) || x2c(x)] = solveFormula({
            value: cell[key],
            table: this,
            raise,
            evaluates,
            origin: { y, x },
          });
        }
      }
    }
    return result;
  }

  public getMatrix({
    area,
    evaluates = true,
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
        const cell = this.getByPoint({ y, x });
        if (cell != null && filter(cell)) {
          matrix[y - top][x - left] = {
            ...cell,
            value: solveFormula({
              value: cell?.value,
              table: this,
              raise,
              evaluates,
              origin: { y, x },
            }),
          };
        }
      }
    }
    return matrix;
  }
  public getObject({ evaluates = true, raise = false, filter = noFilter }: GetProps = {}) {
    const result: CellsByAddressType = {};
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          result[p2a({ y, x })] = {
            ...cell,
            value: solveFormula({
              value: cell?.value,
              table: this,
              raise,
              evaluates,
              origin: { y, x },
            }),
          };
        }
      }
    }
    return result;
  }
  public getRows({ evaluates = true, raise = false, filter = noFilter }: GetProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsByAddressType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          row[x2c(x) || y2r(y)] = {
            ...cell,
            value: solveFormula({
              value: cell?.value,
              table: this,
              raise,
              evaluates,
              origin: { y, x },
            }),
          };
        }
      }
    }
    return result;
  }
  public getCols({ evaluates = true, raise = false, filter = noFilter }: GetProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsByAddressType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          col[y2r(y) || x2c(x)] = {
            ...cell,
            value: solveFormula({
              value: cell?.value,
              table: this,
              raise,
              evaluates,
              origin: { y, x },
            }),
          };
        }
      }
    }
    return result;
  }

  private pushHistory(history: HistoryType) {
    const hub = this.hub;
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
    if (history.operation === 'DELETE_ROWS' || history.operation === 'DELETE_COLS') {
      history.deleted.forEach((ids) => {
        ids.forEach((id) => {
          delete this.hub.data[id];
        });
      });
    }
    if (history.operation === 'MOVE') {
      Object.keys(history.lostRows).forEach((address) => {
        const idMatrix = history.lostRows[address];
        idMatrix.map((ids) =>
          ids.forEach((id) => {
            if (id != null) {
              delete this.hub.data[id];
            }
          }),
        );
      });
    }
  }

  private cleanStrayed(history: HistoryType) {
    if (history.operation === 'ADD_ROWS' || history.operation === 'ADD_COLS') {
      history.idMatrix.forEach((ids) => {
        ids.forEach((id) => {
          delete this.hub.data[id];
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
    cell.system!.changedAt = changedAt || new Date();
    return cell;
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

    // to dst(to)
    const lostRows = putMatrix(this.idMatrix, matrixFrom, dst, (srcId, dstId) => {
      const srcCell = this.hub.data[srcId];
      const dstCell = this.hub.data[dstId];
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
        this.hub.data[srcId] = {
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

    const srcTableRaw = srcTable as Table;
    const srcContext = this.hub.contextsBySheetId[srcTable.getSheetId()];
    // to src(from)
    putMatrix(srcTableRaw.idMatrix, matrixNew, src, (newId, currentId) => {
      const srcCell = srcTableRaw.hub.data[currentId];
      if (operator === 'USER' && operation.hasOperation(srcCell?.prevention, operation.MoveFrom)) {
        return false;
      }
      const policy = this.policies[srcCell?.policy!] ?? defaultPolicy;
      const patch = policy.restrict({
        table: srcTableRaw,
        point: srcTableRaw.getPointById(currentId),
        patch: undefined,
        original: srcCell,
        operation: operation.MoveFrom,
      });
      if (patch) {
        srcTableRaw.hub.data[newId] = {
          ...patch,
          system: {
            id: newId,
            sheetId: srcTableRaw.sheetId,
            changedAt: new Date(),
            dependents: new Set(),
          },
        };
      }
      return true;
    });
    if (srcTable !== this && srcContext !== null) {
      const { dispatch } = srcContext;
      requestAnimationFrame(() => dispatch(updateTable(srcTableRaw)));
    }

    if (historicize) {
      this.pushHistory({
        applyed: true,
        operation: 'MOVE',
        srcSheetId: srcTable.getSheetId(),
        dstSheetId: this.sheetId,
        undoReflection,
        redoReflection,
        diffBefore,
        src,
        dst,
        matrixFrom,
        matrixTo,
        matrixNew,
        lostRows,
      });
    }
    return this.clone(false);
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
          ...srcTable.getByPoint({
            y: topFrom + (i % maxHeight),
            x: leftFrom + (j % maxWidth),
          }),
        };
        const dstPoint = { y: toY, x: toX };
        const value = identifyFormula({
          value: cell?.value,
          table: this,
          originPath: this.getPathById(this.getId(dstPoint)),
          slideY,
          slideX,
        });
        this.setChangedAt(cell, changedAt);
        const address = p2a(dstPoint);
        if (onlyValue) {
          const dstCell = this.getByPoint(dstPoint);
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
    const cell = this.getByPoint(point);
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

    Object.keys(diff).forEach((address) => {
      const point = a2p(address);
      const id = this.getId(point);
      const original = this.hub.data[id]!;
      let patch = { ...diff[address] };
      if (operator === 'USER' && operation.hasOperation(original.prevention, operation.Update)) {
        return;
      }

      if (formulaIdentify) {
        patch.value = identifyFormula({
          value: patch.value,
          table: this,
          originPath: this.getPathById(id),
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
        diffAfter[id] = this.hub.data[id] = { ...original, ...patch };
      } else {
        diffAfter[id] = this.hub.data[id] = patch;
      }
    });
    //this.clearSolvedCaches();
    return {
      diffBefore,
      diffAfter,
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
    const { diffBefore, diffAfter } = this._update({
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
    return this.clone(true);
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
          const currentCell = this.getByPoint(point);
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
    const current = this.getByPoint(point);
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

  public addRowsAndUpdate({
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
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const returned = this.addRows({
      y,
      numRows,
      baseY,
      undoReflection,
      redoReflection,
    });

    Object.assign(this.hub.lastHistory!, this._update({ diff, partial, updateChangedAt, operator }), { partial });

    return returned;
  }

  public addRows({
    y,
    numRows,
    baseY,
    // operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    y: number;
    numRows: number;
    baseY: number;
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
        const cell = this.getByPoint({ y: baseY, x: j });
        const copied = this.copyCellLayout(cell);
        this.hub.data[id] = {
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
      operation: 'ADD_ROWS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection,
      redoReflection,
      y,
      numRows,
      idMatrix: rows,
    });
    return this.clone(false);
  }
  public deleteRows({
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

    const ys: number[] = [];
    for (let i = y; i < y + numRows; i++) {
      const cell = this.getByPoint({ y: i, x: 0 });
      if (operator === 'USER' && operation.hasOperation(cell?.prevention, operation.DeleteRow)) {
        console.warn(`Cannot delete row ${i}.`);
        return this;
      }
      ys.unshift(i);
    }
    const deleted: MatrixType = [];
    ys.forEach((y) => {
      const row = this.idMatrix.splice(y, 1);
      deleted.unshift(row[0]);
    });
    this.area.bottom -= ys.length;
    this.pushHistory({
      applyed: true,
      operation: 'DELETE_ROWS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection,
      redoReflection,
      ys: ys.reverse(),
      deleted,
    });
    return this.clone(false);
  }

  public addColsAndUpdate({
    x,
    numCols,
    baseX,
    diff,
    partial,
    updateChangedAt,
    undoReflection,
    redoReflection,
  }: {
    x: number;
    numCols: number;
    baseX: number;
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const returned = this.addCols({
      x,
      numCols,
      baseX,
      undoReflection,
      redoReflection,
    });

    Object.assign(this.hub.lastHistory!, this._update({ diff, partial, updateChangedAt }), { partial });
    return returned;
  }

  public addCols({
    x,
    numCols,
    baseX,
    undoReflection,
    redoReflection,
  }: {
    x: number;
    numCols: number;
    baseX: number;
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
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.generateId();
        row.push(id);
        const cell = this.getByPoint({ y: i, x: baseX });
        const copied = this.copyCellLayout(cell);
        this.idMatrix[i].splice(x, 0, id);
        this.hub.data[id] = {
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
      operation: 'ADD_COLS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection: undoReflection,
      redoReflection: redoReflection,
      x,
      numCols,
      idMatrix: rows,
    });
    return this.clone(false);
  }
  public deleteCols({
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

    const xs: number[] = [];
    for (let i = x; i < x + numCols; i++) {
      const cell = this.getByPoint({ y: 0, x: i });
      if (operator === 'USER' && operation.hasOperation(cell?.prevention, operation.DeleteCol)) {
        console.warn(`Cannot delete col ${i}.`);
        continue;
      }
      xs.unshift(i);
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

    this.pushHistory({
      applyed: true,
      operation: 'DELETE_COLS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      undoReflection: undoReflection,
      redoReflection: redoReflection,
      xs: xs.reverse(),
      deleted,
    });
    return this.clone(false);
  }
  public getHistories() {
    return [...this.hub.histories];
  }
  public getHistoryIndex() {
    return this.hub.historyIndex;
  }
  public getHistorySize() {
    return this.hub.histories.length;
  }
  public getHistoryLimit() {
    return this.hub.historyLimit;
  }

  public setFunctions(additionalFunctions: FunctionMapping) {
    this.functions = { ...functionsDefault, ...additionalFunctions };
  }

  public getArea(): AreaType {
    return { ...this.area };
  }

  public parse(point: PointType, value: string) {
    const cell = this.getByPoint(point) ?? {};
    const parser = this.parsers[cell.parser ?? ''] ?? defaultParser;
    return parser.call(value, cell);
  }

  public render(props: RendererCallProps) {
    const { point, writer } = props;
    const cell = this.getByPoint(point) ?? {};
    const renderer = this.renderers[cell.renderer ?? ''] ?? defaultRenderer;
    return renderer.call({ table: this, point, writer });
  }

  public stringify({ point, cell, evaluates = true }: { point: PointType; cell?: CellType; evaluates?: boolean }) {
    if (cell == null) {
      cell = this.getByPoint(point);
    }
    if (cell == null) {
      return '';
    }
    const renderer = this.renderers[cell?.renderer ?? ''] ?? defaultRenderer;
    const s = renderer.stringify(cell, { cell, table: this, point });

    if (s[0] === '=') {
      if (evaluates) {
        return String(solveFormula({ value: s, table: this, raise: false, evaluates, origin: point }) ?? '');
      }
      const lexer = new Lexer(s.substring(1));
      lexer.tokenize();
      return '=' + lexer.stringifyToRef(this);
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

  private applyDiff(diff: CellsByIdType, partial = true) {
    if (!partial) {
      Object.assign(this.hub.data, diff);
      return;
    }
    Object.keys(diff).map((id) => {
      const cell = diff[id];
      this.hub.data[id] = { ...this.getById(id), ...cell };
    });
  }

  public undo() {
    if (this.hub.historyIndex < 0) {
      return { history: null, newTable: this as Table };
    }
    const history = this.hub.histories[this.hub.historyIndex--];
    history.applyed = false;
    this.hub.currentHistory = history;
    const srcTable = this.getTableBySheetId(history.srcSheetId);
    const dstTable = this.getTableBySheetId(history.dstSheetId);
    switch (history.operation) {
      case 'UPDATE':
        // diffBefore is guaranteed as total of cell (not partial)
        dstTable.applyDiff(history.diffBefore, false);
        break;
      case 'ADD_ROWS': {
        if (history.diffBefore) {
          dstTable.applyDiff(history.diffBefore, false);
        }
        const { height } = matrixShape({ matrix: history.idMatrix });
        dstTable.idMatrix.splice(history.y, height);
        dstTable.area.bottom -= height;
        break;
      }
      case 'ADD_COLS': {
        if (history.diffBefore) {
          this.applyDiff(history.diffBefore, false);
        }
        const { width } = matrixShape({ matrix: history.idMatrix });
        dstTable.idMatrix.forEach((row) => {
          row.splice(history.x, width);
        });
        dstTable.area.right -= width;
        break;
      }
      case 'DELETE_ROWS': {
        const { ys, deleted } = history;
        ys.forEach((y, i) => {
          dstTable.idMatrix.splice(y, 0, deleted[i]);
        });
        dstTable.area.bottom += ys.length;
        break;
      }
      case 'DELETE_COLS': {
        const { xs, deleted } = history;
        dstTable.idMatrix.forEach((row, i) => {
          for (let j = 0; j < xs.length; j++) {
            row.splice(xs[j], 0, deleted[i][j]);
          }
        });
        dstTable.area.right += xs.length;
        break;
      }
      case 'MOVE': {
        const { top: yFrom, left: xFrom } = history.src;
        const { top: yTo, left: xTo } = history.dst;
        const { height: rows, width: cols } = matrixShape({
          matrix: history.matrixFrom,
          base: -1,
        });
        putMatrix(srcTable.idMatrix, history.matrixFrom, {
          top: yFrom,
          left: xFrom,
          bottom: yFrom + rows,
          right: xFrom + cols,
        });
        putMatrix(dstTable.idMatrix, history.matrixTo, {
          top: yTo,
          left: xTo,
          bottom: yTo + rows,
          right: xTo + cols,
        });
        const { diffBefore } = history;
        dstTable.applyDiff(diffBefore, false);
        break;
      }
    }
    return {
      history,
      newTable: this.clone(!shouldTracking(history.operation)),
      callback: ({ table: { hub } }: StoreType) => {
        Object.assign(hub, history.undoReflection?.hub);
        hub.reflect();
      },
    };
  }

  public redo() {
    if (this.hub.historyIndex + 1 >= this.hub.histories.length) {
      return { history: null, newTable: this as Table };
    }
    const history = this.hub.histories[++this.hub.historyIndex];
    history.applyed = true;
    this.hub.currentHistory = history;

    const srcTable = this.getTableBySheetId(history.srcSheetId);
    const dstTable = this.getTableBySheetId(history.dstSheetId);

    switch (history.operation) {
      case 'UPDATE':
        dstTable.applyDiff(history.diffAfter, history.partial);
        break;
      case 'ADD_ROWS': {
        if (history.diffAfter) {
          dstTable.applyDiff(history.diffAfter, history.partial);
        }
        const { height } = matrixShape({ matrix: history.idMatrix });
        dstTable.idMatrix.splice(history.y, 0, ...history.idMatrix);
        dstTable.area.bottom += height;
        break;
      }
      case 'ADD_COLS': {
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
      case 'DELETE_ROWS': {
        const { ys } = history;
        [...ys].reverse().forEach((y) => {
          dstTable.idMatrix.splice(y, 1);
        });
        dstTable.area.bottom -= ys.length;
        break;
      }
      case 'DELETE_COLS': {
        const { xs } = history;
        [...xs].reverse().forEach((x) => {
          dstTable.idMatrix.forEach((row) => {
            row.splice(x, 1);
          });
        });
        dstTable.area.right -= xs.length;
        break;
      }
      case 'MOVE': {
        const { src, dst } = history;
        dstTable.move({ srcTable, src, dst, operator: 'USER', historicize: false });
      }
    }
    return {
      history,
      newTable: this.clone(!shouldTracking(history.operation)),
      callback: ({ table: { hub } }: StoreType) => {
        Object.assign(hub, history.redoReflection?.hub);
        hub.reflect();
      },
    };
  }
  public getFunction(name: string) {
    return this.functions[name];
  }

  public getLabel(key: string, n: number) {
    const labeler = this.labelers[key];
    return labeler?.(n);
  }
  public getBase() {
    return this;
  }

  public getSolvedCache(point: PointType) {
    const id = this.getId(point);
    return this.hub.solvedCaches.get(id);
  }
  public setSolvedCache(point: PointType, value: any) {
    const id = this.getId(point);
    this.hub.solvedCaches.set(id, value);
  }
  public clearSolvedCaches() {
    this.hub.solvedCaches.clear();
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

  public updatePolicies(policies: Policies | undefined) {
    this.policies = { ...policies };
  }

  get __raw__(): Table {
    return this;
  }
}
