import { defaultParser } from "../parsers/core";
import { defaultRenderer } from "../renderers/core";
import {
  Id,
  Ids,
  IdMatrix,
  AreaType,
  CellsByIdType,
  CellsByAddressType,
  PointType,
  WriterType,
  Address,
  CellFilter,
  Labelers,
  MatrixType,
  CellType,
  Parsers,
  Renderers,
  HistoryType,
  StoreReflectionType,
  ShapeType,
} from "../types";
import {areaShape, createMatrix, matrixShape, putMatrix} from "./structs";
import { a2p, x2c, p2a, y2r, grantAddressAbsolute } from "./converters";
import { FunctionMapping } from "../formula/functions/__base";
import { functions as functionsDefault } from "../formula/mapping";
import { convertFormulaAbsolute, Lexer } from "../formula/evaluator";
import { solveFormula } from "../formula/solver";

import {DEFAULT_HEIGHT, DEFAULT_WIDTH, HISTORY_LIMIT, OVERSCAN_X, OVERSCAN_Y} from "../constants";
import { shouldTracking } from "../store/helpers";

type Props = {
  numRows?: number;
  numCols?: number;
  cells?: CellsByAddressType;
  parsers?: Parsers;
  renderers?: Renderers;
  labelers?: Labelers;
  useBigInt?: boolean;
  historyLimit?: number;
  minNumRows?: number;
  maxNumRows?: number;
  minNumCols?: number;
  maxNumCols?: number;
  headerHeight?: number;
  headerWidth?: number;
  functions?: typeof functionsDefault;
};

const cellFilter = (cell: CellType) => true;

type GetProps = {
  evaluates?: boolean;
  raise?: boolean;
  filter?: CellFilter;
};

type MoveProps = {
  src: AreaType;
  dst: AreaType;
  reflection?: StoreReflectionType;
};

type GetFlattenProps = GetProps & {
  key?: keyof CellType;
};

type GetPropsWithArea = GetProps & {
  area?: AreaType;
};

type GetFlattenPropsWithArea = GetFlattenProps & {
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
  getRectSize(area: AreaType): ShapeType;
  getAddressById(id: Id, slideY: number, slideX: number): string | undefined;
  getAddressesByIds(ids: CellsByIdType): CellsByAddressType;
  getPointById(id: Id): PointType;
  getByPoint(point: PointType): CellType | undefined;
  getById(id: Id): CellType | undefined;
  getNumRows(base?: number): number;
  getNumCols(base?: number): number;
  getMatrixFlatten(args?: GetFlattenPropsWithArea): any[][];
  getObjectFlatten(args?: GetFlattenProps): CellsByAddressType;
  getRowsFlatten(args?: GetFlattenProps): CellsByAddressType[];
  getColsFlatten(args?: GetFlattenProps): CellsByAddressType[];
  getMatrix(args?: GetPropsWithArea): (CellType | null)[][];
  getObject(args?: GetProps): CellsByAddressType;
  getRows(args?: GetProps): CellsByAddressType[];
  getCols(args?: GetProps): CellsByAddressType[];
  move(args: MoveProps): UserTable;
  copy(args: MoveProps): UserTable;
  update(args: {
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }): UserTable;
  writeMatrix(args: {
    point: PointType;
    matrix: MatrixType<string>;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }): UserTable;
  write(args: {
    point: PointType;
    value: string;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }): UserTable;
  addRowsAndUpdate(args: {
    y: number;
    numRows: number;
    baseY: number;
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }): UserTable;
  addRows(args: {
    y: number;
    numRows: number;
    baseY: number;
    reflection?: StoreReflectionType;
  }): UserTable;
  removeRows(args: {
    y: number;
    numRows: number;
    reflection?: StoreReflectionType;
  }): UserTable;
  addColsAndUpdate(args: {
    x: number;
    numCols: number;
    baseX: number;
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }): UserTable;
  addCols(args: {
    x: number;
    numCols: number;
    baseX: number;
    reflection?: StoreReflectionType;
  }): UserTable;
  removeCols(args: {
    x: number;
    numCols: number;
    reflection?: StoreReflectionType;
  }): UserTable;
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

  private head: bigint | number;
  private idMatrix: IdMatrix;
  private data: CellsByIdType;
  private area: AreaType;
  private parsers: Parsers;
  private renderers: Renderers;
  private labelers: Labelers;
  private functions: FunctionMapping = {};
  private lastHistory?: HistoryType;
  private histories: HistoryType[];
  private historyIndex: number;
  private addressesById: { [id: Id]: Address };
  private historyLimit: number;
  private solvedCaches: { [address: Address]: any };

  constructor({
    numRows = 0,
    numCols = 0,
    cells = {},
    parsers = {},
    renderers = {},
    labelers = {},
    useBigInt = false,
    historyLimit: historyLimit = HISTORY_LIMIT,
    minNumRows = 1,
    maxNumRows = -1,
    minNumCols = 1,
    maxNumCols = -1,
    headerWidth = -1,
    headerHeight = -1,
    functions = functionsDefault,
  }: Props) {
    this.head = useBigInt ? BigInt(0) : 0;
    this.data = {};
    this.area = { top: 0, left: 0, bottom: numRows, right: numCols };
    this.parsers = parsers;
    this.renderers = renderers;
    this.labelers = labelers;
    this.idMatrix = [];
    this.histories = [];
    this.historyIndex = -1;
    this.addressesById = {};
    this.historyLimit = historyLimit;
    this.changedAt = new Date();
    this.minNumRows = minNumRows;
    this.maxNumRows = maxNumRows;
    this.minNumCols = minNumCols;
    this.maxNumCols = maxNumCols;
    this.solvedCaches = {};
    this.headerHeight = headerHeight;
    this.headerWidth = headerWidth;
    this.functions = functions;

    const common = cells.default;
    // make idMatrix beforehand
    for (let y = 0; y < numRows + 1; y++) {
      const ids: Ids = [];
      this.idMatrix.push(ids);
      for (let x = 0; x < numCols + 1; x++) {
        const id = this.generateId();
        ids.push(id);
        const address = p2a({ y, x });
        this.addressesById[id] = address;
      }
    }
    for (let y = 0; y < numRows + 1; y++) {
      const rowId = y2r(y);
      const rowDefault = cells[rowId];
      for (let x = 0; x < numCols + 1; x++) {
        const id = this.getId({ y, x });
        const address = p2a({ y, x });
        const colId = x2c(x);
        const colDefault = cells[colId];
        const cell = cells[address];
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
        } as CellType;
        stacked.value = convertFormulaAbsolute({
          value: stacked?.value,
          table: this,
        });
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
        this.data[id] = stacked;
      }
    }
    this.setTotalSize();
  }

  private generateId() {
    return (this.head++).toString(36);
  }

  public getRectSize({top, left, bottom, right}: AreaType) {
    let width = 0, height = 0;
    for (let x = left || 1; x < right; x++) {
      width += this.getByPoint({ y: 0, x })?.width || DEFAULT_WIDTH;
    }
    for (let y = top || 1; y < bottom; y++) {
      height += this.getByPoint({ y, x: 0 })?.height || DEFAULT_HEIGHT;
    }
    return {width, height};
  }
  private setTotalSize() {
    const {bottom, right} = this.area;
    const {width, height} = this.getRectSize({top: 1, left: 1, bottom: bottom + 1, right: right + 1});
    this.totalWidth = width + this.headerWidth;
    this.totalHeight = height + this.headerHeight;
  }

  private shallowCopy({ copyCache = true }: { copyCache?: boolean } = {}) {
    const copied = new Table({});
    copied.changedAt = new Date();
    copied.lastChangedAt = this.changedAt;
    copied.head = this.head;
    copied.idMatrix = this.idMatrix;
    copied.data = this.data;
    copied.area = this.area;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    copied.labelers = this.labelers;
    copied.functions = this.functions;
    copied.histories = this.histories;
    copied.historyLimit = this.historyLimit;
    copied.historyIndex = this.historyIndex;
    copied.minNumRows = this.minNumRows;
    copied.maxNumRows = this.maxNumRows;
    copied.minNumCols = this.minNumCols;
    copied.maxNumCols = this.maxNumCols;
    copied.headerHeight = this.headerHeight;
    copied.headerWidth = this.headerWidth;
    copied.setTotalSize();
    if (copyCache) {
      copied.addressesById = this.addressesById;
    } else {
      // force reset
      this.addressesById = {};
    }
    return copied;
  }

  public getAddressById(id: Id, slideY = 0, slideX = 0) {
    const absCol = id.startsWith("$");
    if (absCol) {
      id = id.slice(1);
      slideX = 0;
    }
    const absRow = id.endsWith("$");
    if (absRow) {
      id = id.slice(0, -1);
      slideY = 0;
    }

    for (let y = 0; y < this.idMatrix.length; y++) {
      const ids = this.idMatrix[y];
      for (let x = 0; x < ids.length; x++) {
        const existing = ids[x];
        const address = p2a({ y, x });
        this.addressesById[existing] = address;
        if (existing === id) {
          const slidedAddress = p2a({
            y: y + slideY,
            x: x + slideX,
          });
          return grantAddressAbsolute(slidedAddress, absCol, absRow);
        }
      }
    }
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

  public getPointById(id: Id): PointType {
    const address = this.getAddressById(id);
    if (address) {
      return a2p(address);
    }
    return { y: 0, x: 0 };
  }
  private getId(point: PointType) {
    const { y, x } = point;
    return this.idMatrix[y]?.[x];
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
    const value = this.data[id];
    return value;
  }

  public getById(id: Id) {
    return this.data[id];
  }

  public getNumRows(base = 0) {
    const { top, left, bottom, right } = this.area;
    return base + bottom - top;
  }

  public getNumCols(base = 0) {
    const { top, left, bottom, right } = this.area;
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

  public getMatrixFlatten({
    area,
    key = "value",
    evaluates = true,
    raise = false,
    filter = cellFilter,
  }: GetFlattenPropsWithArea = {}) {
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
        matrix[y - top][x - left] = evaluates
          ? solveFormula({
              value: cell[key],
              table: this,
              raise,
            })
          : cell[key];
      }
    }
    return matrix;
  }
  public getObjectFlatten({
    key = "value",
    evaluates = true,
    raise = false,
    filter = cellFilter,
  }: GetFlattenProps = {}) {
    const result: CellsByAddressType = {};
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          result[p2a({ y, x })] = evaluates
            ? solveFormula({
                value: cell[key],
                table: this,
                raise,
              })
            : cell[key];
        }
      }
    }
    return result;
  }
  public getRowsFlatten({
    key = "value",
    evaluates = true,
    raise = false,
    filter = cellFilter,
  }: GetFlattenProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsByAddressType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          row[x2c(x) || y2r(y)] = evaluates
            ? solveFormula({
                value: cell[key],
                table: this,
                raise,
              })
            : cell[key];
        }
      }
    }
    return result;
  }
  public getColsFlatten({
    key = "value",
    evaluates = true,
    raise = false,
    filter = cellFilter,
  }: GetFlattenProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsByAddressType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          col[y2r(y) || x2c(x)] = evaluates
            ? solveFormula({
                value: cell[key],
                table: this,
                raise,
              })
            : cell[key];
        }
      }
    }
    return result;
  }
  public getMatrix({
    area,
    evaluates = true,
    raise = false,
    filter = cellFilter,
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
            value: evaluates
              ? solveFormula({
                  value: cell?.value,
                  table: this,
                  raise,
                })
              : cell?.value,
          };
        }
      }
    }
    return matrix;
  }
  public getObject({
    evaluates = true,
    raise = false,
    filter = cellFilter,
  }: GetProps = {}) {
    const result: CellsByAddressType = {};
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          result[p2a({ y, x })] = {
            ...cell,
            value: evaluates
              ? solveFormula({
                  value: cell?.value,
                  table: this,
                  raise,
                })
              : cell?.value,
          };
        }
      }
    }
    return result;
  }
  public getRows({
    evaluates = true,
    raise = false,
    filter = cellFilter,
  }: GetProps = {}) {
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
            value: evaluates
              ? solveFormula({
                  value: cell?.value,
                  table: this,
                  raise,
                })
              : cell?.value,
          };
        }
      }
    }
    return result;
  }
  public getCols({
    evaluates = true,
    raise = false,
    filter = cellFilter,
  }: GetProps = {}) {
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
            value: evaluates
              ? solveFormula({
                  value: cell?.value,
                  table: this,
                  raise,
                })
              : cell?.value,
          };
        }
      }
    }
    return result;
  }

  private pushHistory(history: HistoryType) {
    const strayedHistories = this.histories.splice(
      this.historyIndex + 1,
      this.histories.length
    );
    strayedHistories.forEach(this.cleanStrayed.bind(this));
    this.histories.push(history);
    this.lastHistory = history;
    if (this.histories.length > this.historyLimit) {
      const kickedOut = this.histories.splice(0, 1)[0];
      this.cleanObsolete(kickedOut);
    } else {
      this.historyIndex++;
    }
  }

  private cleanObsolete(history: HistoryType) {
    if (
      history.operation === "REMOVE_ROWS" ||
      history.operation === "REMOVE_COLS"
    ) {
      history.idMatrix.forEach((ids) => {
        ids.forEach((id) => {
          delete this.data[id];
        });
      });
    }
    if (history.operation === "MOVE") {
      Object.keys(history.lostRows).forEach((address) => {
        const idMatrix = history.lostRows[address];
        idMatrix.map((ids) =>
          ids.forEach((id) => {
            delete this.data[id];
          })
        );
      });
    }
  }

  private cleanStrayed(history: HistoryType) {
    if (history.operation === "ADD_ROWS" || history.operation === "ADD_COLS") {
      history.idMatrix.forEach((ids) => {
        ids.forEach((id) => {
          delete this.data[id];
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
        if (id) {
          ids.push(id);
        }
      }
    }
    return matrix;
  }

  private setChangedAt(cell?: CellType, changedAt?: Date) {
    if (cell == null) {
      return null;
    }
    cell.changedAt = changedAt || new Date();
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
    src,
    dst,
    reflection = {},
  }: MoveProps) {
    const changedAt = new Date();
    const matrixFrom = this.getIdMatrixFromArea(src);
    const matrixTo = this.getIdMatrixFromArea(dst);
    const matrixNew = this.getNewIdMatrix(src);
    putMatrix(this.idMatrix, matrixNew, src);
    matrixFrom.forEach((ids) => {
      ids
        .map(this.getById.bind(this))
        .filter((c) => c)
        .forEach((cell) => this.setChangedAt(cell, changedAt));
    });
    const lostRows = putMatrix(this.idMatrix, matrixFrom, dst);
    this.pushHistory({
      operation: "MOVE",
      reflection,
      matrixFrom,
      matrixTo,
      matrixNew,
      pointFrom: { y: src.top, x: src.left },
      pointTo: { y: dst.top, x: dst.left },
      lostRows,
    });
    return this.shallowCopy({ copyCache: false });
  }

  public copy({
    src,
    dst,
    reflection = {},
  }: MoveProps) {
    const { height: maxHeight, width: maxWidth } = areaShape({
      ...src,
      base: 1,
    });
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
        const slideY = toY - fromY;
        const slideX = toX - fromX;
        const cell = {
          ...this.getByPoint({
            y: topFrom + (i % maxHeight),
            x: leftFrom + (j % maxWidth),
          }),
        };
        const value = convertFormulaAbsolute({
          value: cell?.value,
          table: this,
          slideY,
          slideX,
        });
        this.setChangedAt(cell, changedAt);
        diff[p2a({ y: toY, x: toX })] = {
          ...cell,
          style: { ...cell?.style },
          value,
        };
      }
    }
    return this.update({ diff, partial: false, reflection });
  }

  private _update({
    diff,
    partial = true,
    updateChangedAt = true,
  }: {
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
  }) {
    const diffBefore: CellsByIdType = {};
    const diffAfter: CellsByIdType = {};
    const changedAt = new Date();
    Object.keys(diff).forEach((address) => {
      const cell = { ...diff[address] };
      if (updateChangedAt) {
        this.setChangedAt(cell, changedAt);
      }
      cell.value = convertFormulaAbsolute({
        value: cell.value,
        table: this,
      });
      const point = a2p(address);
      const id = this.getId(point);

      // must not partial
      diffBefore[id] = this.getByPoint(point);
      diffAfter[id] = cell;
      if (partial) {
        this.data[id] = { ...this.data[id], ...cell };
      } else {
        this.data[id] = cell;
      }
    });
    this.solvedCaches = {};
    return {
      diffBefore,
      diffAfter,
    };
  }

  public update({
    diff,
    partial = true,
    updateChangedAt = true,
    reflection = {},
  }: {
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }) {
    const { diffBefore, diffAfter } = this._update({
      diff,
      partial,
      updateChangedAt,
    });

    this.pushHistory({
      operation: "UPDATE",
      reflection,
      diffBefore,
      diffAfter,
      partial,
    });

    return this.shallowCopy({ copyCache: true });
  }

  public writeMatrix({
    point,
    matrix,
    updateChangedAt = true,
    reflection = {},
  }: {
    point: PointType;
    matrix: MatrixType<string>;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }) {
    const { y: baseY, x: baseX } = point;
    const diff: CellsByAddressType = {};
    matrix.forEach((cols, i) => {
      const y = baseY + i;
      if (y > this.bottom) {
        return;
      }
      cols.forEach((value, j) => {
        const x = baseX + j;
        if (x > this.right) {
          return;
        }
        const cell = this.parse({ y, x }, value);
        diff[p2a({ y, x })] = cell;
      });
    });
    return this.update({
      diff,
      partial: true,
      updateChangedAt,
      reflection,
    });
  }

  public write({
    point,
    value,
    updateChangedAt = true,
    reflection = {},
  }: {
    point: PointType;
    value: string;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }) {
    return this.writeMatrix({
      point,
      matrix: [[value]],
      updateChangedAt,
      reflection,
    });
  }

  public addRowsAndUpdate({
    y,
    numRows,
    baseY,
    diff,
    partial,
    updateChangedAt,
    reflection = {},
  }: {
    y: number;
    numRows: number;
    baseY: number;
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }) {
    const returned = this.addRows({
      y,
      numRows,
      baseY,
      reflection,
    });

    Object.assign(
      this.lastHistory!,
      this._update({ diff, partial, updateChangedAt }),
      { partial }
    );

    return returned;
  }

  public addRows({
    y,
    numRows,
    baseY,
    reflection = {},
  }: {
    y: number;
    numRows: number;
    baseY: number;
    reflection?: StoreReflectionType;
  }) {
    if (
      this.maxNumRows !== -1 &&
      this.getNumRows() + numRows > this.maxNumRows
    ) {
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
        this.data[id] = { ...copied, changedAt };
      }
      rows.push(row);
    }
    this.idMatrix.splice(y, 0, ...rows);
    this.area.bottom += numRows;

    this.pushHistory({
      operation: "ADD_ROWS",
      reflection,
      y,
      idMatrix: rows,
    });
    return this.shallowCopy({ copyCache: false });
  }
  public removeRows({
    y,
    numRows,
    reflection = {},
  }: {
    y: number;
    numRows: number;
    reflection?: StoreReflectionType;
  }) {
    if (
      this.minNumRows !== -1 &&
      this.getNumRows() - numRows < this.minNumRows
    ) {
      console.error(`At least ${this.minNumRows} row(s) are required.`);
      return this;
    }
    const rows = this.idMatrix.splice(y, numRows);
    this.area.bottom -= numRows;
    this.pushHistory({
      operation: "REMOVE_ROWS",
      reflection,
      y,
      idMatrix: rows,
    });
    return this.shallowCopy({ copyCache: false });
  }

  public addColsAndUpdate({
    x,
    numCols,
    baseX,
    diff,
    partial,
    updateChangedAt,
    reflection = {},
  }: {
    x: number;
    numCols: number;
    baseX: number;
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }) {
    const returned = this.addCols({
      x,
      numCols,
      baseX,
      reflection,
    });

    Object.assign(
      this.lastHistory!,
      this._update({ diff, partial, updateChangedAt }),
      { partial }
    );
    return returned;
  }

  public addCols({
    x,
    numCols,
    baseX,
    reflection = {},
  }: {
    x: number;
    numCols: number;
    baseX: number;
    reflection?: StoreReflectionType;
  }) {
    if (
      this.maxNumCols !== -1 &&
      this.getNumCols() + numCols > this.maxNumCols
    ) {
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
        this.data[id] = { ...copied, changedAt };
      }
      rows.push(row);
    }
    this.area.right += numCols;

    this.pushHistory({
      operation: "ADD_COLS",
      reflection,
      x,
      idMatrix: rows,
    });
    return this.shallowCopy({ copyCache: false });
  }
  public removeCols({
    x,
    numCols,
    reflection = {},
  }: {
    x: number;
    numCols: number;
    reflection?: StoreReflectionType;
  }) {
    if (
      this.minNumCols !== -1 &&
      this.getNumCols() - numCols < this.minNumCols
    ) {
      console.error(`At least ${this.minNumCols} column(s) are required.`);
      return this;
    }
    const rows: IdMatrix = [];
    this.idMatrix.forEach((row) => {
      const deleted = row.splice(x, numCols);
      rows.push(deleted);
    });
    this.area.right -= numCols;

    this.pushHistory({
      operation: "REMOVE_COLS",
      reflection,
      x,
      idMatrix: rows,
    });
    return this.shallowCopy({ copyCache: false });
  }
  public getHistories() {
    return [...this.histories];
  }
  public getHistoryIndex() {
    return this.historyIndex;
  }
  public getHistorySize() {
    return this.histories.length;
  }
  public getHistoryLimit() {
    return this.historyLimit;
  }

  public setFunctions(additionalFunctions: FunctionMapping) {
    this.functions = { ...functionsDefault, ...additionalFunctions };
  }

  public getArea(): AreaType {
    return { ...this.area };
  }

  public parse(point: PointType, value: string) {
    const cell = this.getByPoint(point) || {};
    const parser = this.parsers[cell.parser || ""] || defaultParser;
    return parser.parse(value, cell);
  }

  public render(point: PointType, writer?: WriterType) {
    const cell = this.getByPoint(point) || {};
    const renderer = this.renderers[cell.renderer || ""] || defaultRenderer;
    return renderer.render(this, point, writer);
  }

  public stringify(point: PointType, value?: any, evaluates = false) {
    const cell = this.getByPoint(point);
    const renderer = this.renderers[cell?.renderer || ""] || defaultRenderer;
    const s = renderer.stringify(
      typeof value === "undefined" ? { ...cell } : { ...cell, value }
    );

    if (s[0] === "=") {
      if (evaluates) {
        return String(
          solveFormula({ value: s, table: this, raise: false })
        );
      }
      const lexer = new Lexer(s.substring(1));
      lexer.tokenize();
      return "=" + lexer.stringifyToRef(this);
    }
    return s;
  }

  public trim(area: AreaType): ReadonlyTable {
    const copied = new Table({});
    copied.area = area;
    copied.idMatrix = this.idMatrix;
    copied.data = this.data;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    copied.labelers = this.labelers;
    copied.functions = this.functions;
    copied.addressesById = this.addressesById;
    copied.solvedCaches = this.solvedCaches;
    return copied;
  }

  public getIdByAddress(address: Address) {
    const { y, x } = a2p(address);
    const id = this.getId({ y: Math.abs(y), x: Math.abs(x) });
    if (id) {
      return `#${x < 0 ? "$" : ""}${id}${y < 0 ? "$" : ""}`;
    }
  }

  private applyDiff(diff: CellsByIdType, partial = true) {
    if (!partial) {
      Object.assign(this.data, diff);
      return;
    }
    Object.keys(diff).map((id) => {
      const cell = diff[id];
      this.data[id] = { ...this.getById(id), ...cell };
    });
  }

  public undo() {
    if (this.historyIndex < 0) {
      return { history: null, newTable: this as Table };
    }
    const history = this.histories[this.historyIndex--];
    switch (history.operation) {
      case "UPDATE":
        // diffBefore is guaranteed as total of cell (not partial)
        this.applyDiff(history.diffBefore!, false);
        break;
      case "ADD_ROWS": {
        if (history.diffBefore) {
          this.applyDiff(history.diffBefore, false);
        }
        const { height } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.splice(history.y, height);
        this.area.bottom -= height;
        break;
      }
      case "ADD_COLS": {
        if (history.diffBefore) {
          this.applyDiff(history.diffBefore, false);
        }
        const { width } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.forEach((row) => {
          row.splice(history.x, width);
        });
        this.area.right -= width;
        break;
      }
      case "REMOVE_ROWS": {
        const { height } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.splice(history.y, 0, ...history.idMatrix);
        this.area.bottom += height;
        break;
      }
      case "REMOVE_COLS": {
        const { width } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.forEach((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area.right += width;
        break;
      }
      case "MOVE": {
        const { y: yFrom, x: xFrom } = history.pointFrom;
        const { y: yTo, x: xTo } = history.pointTo;
        const { height: rows, width: cols } = matrixShape({
          matrix: history.matrixFrom,
          base: -1,
        });
        putMatrix(this.idMatrix, history.matrixFrom, {
          top: yFrom,
          left: xFrom,
          bottom: yFrom + rows,
          right: xFrom + cols,
        });
        putMatrix(this.idMatrix, history.matrixTo, {
          top: yTo,
          left: xTo,
          bottom: yTo + rows,
          right: xTo + cols,
        });
        break;
      }
    }
    return {
      history,
      newTable: this.shallowCopy({
        copyCache: !shouldTracking(history.operation),
      }),
    };
  }

  public redo() {
    if (this.historyIndex + 1 >= this.histories.length) {
      return { history: null, newTable: this as Table };
    }
    const history = this.histories[++this.historyIndex];
    switch (history.operation) {
      case "UPDATE":
        this.applyDiff(history.diffAfter!, history.partial);
        break;
      case "ADD_ROWS": {
        if (history.diffAfter) {
          this.applyDiff(history.diffAfter, history.partial);
        }
        const { height } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.splice(history.y, 0, ...history.idMatrix);
        this.area.bottom += height;
        break;
      }
      case "ADD_COLS": {
        if (history.diffAfter) {
          this.applyDiff(history.diffAfter, history.partial);
        }
        const { width } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area.right += width;
        break;
      }
      case "REMOVE_ROWS": {
        const { height } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.splice(history.y, height);
        this.area.bottom -= height;
        break;
      }
      case "REMOVE_COLS": {
        const { width } = matrixShape({ matrix: history.idMatrix });
        this.idMatrix.forEach((row) => {
          row.splice(history.x, width);
        });
        this.area.right -= width;
        break;
      }
      case "MOVE": {
        const { y: yFrom, x: xFrom } = history.pointFrom;
        const { y: yTo, x: xTo } = history.pointTo;
        const { height: rows, width: cols } = matrixShape({
          matrix: history.matrixFrom,
          base: -1,
        });
        putMatrix(this.idMatrix, history.matrixNew, {
          top: yFrom,
          left: xFrom,
          bottom: yFrom + rows,
          right: xFrom + cols,
        });
        putMatrix(this.idMatrix, history.matrixFrom, {
          top: yTo,
          left: xTo,
          bottom: yTo + rows,
          right: xTo + cols,
        });
      }
    }
    return {
      history,
      newTable: this.shallowCopy({
        copyCache: !shouldTracking(history.operation),
      }),
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
  public getSolvedCache(key: string) {
    return this.solvedCaches[key];
  }
  public setSolvedCache(key: string, value: any) {
    this.solvedCaches[key] = value;
  }
}

// just using as a type
export class ReadonlyTable extends Table {}
