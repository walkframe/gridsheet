import { defaultParser } from "../parsers/core";
import { defaultRenderer } from "../renderers/core";
import {
  Id,
  Ids,
  IdMatrix,
  AreaType,
  DataType,
  DiffType,
  PointType,
  WriterType,
  ZoneType,
  Address,
  RowByAddress,
  CellFilter,
  Labelers,
  MatrixType,
} from "../types";
import { CellsType, CellType, Parsers, Renderers } from "../types";
import { areaShape, createMatrix, matrixShape, fillMatrix } from "./structs";
import {
  addressToPoint,
  x2c,
  pointToAddress,
  y2r,
  grantAddressAbsolute,
} from "./converters";
import { FunctionMapping } from "../formula/functions/__base";
import { functions } from "../formula/mapping";
import {
  convertFormulaAbsolute,
  Lexer,
  solveFormula,
} from "../formula/evaluator";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, HISTORY_LIMIT } from "../constants";
import { shouldTracking } from "../store/utils";

type StoreReflectionType = {
  choosing?: PointType;
  cutting?: boolean;
  copyingZone?: ZoneType;
  selectingZone?: ZoneType | undefined;
};

type HistoryUpdateType = {
  operation: "UPDATE";
  reflection?: StoreReflectionType;
  diffBefore: DataType;
  diffAfter: DataType;
  partial: boolean;
};

type HistoryCopyType = {
  operation: "COPY";
  reflection?: StoreReflectionType;
  diffBefore: DataType;
  diffAfter: DataType;
  area: AreaType;
};

type HistoryMoveType = {
  operation: "MOVE";
  reflection?: StoreReflectionType;
  matrixFrom: IdMatrix;
  matrixTo: IdMatrix;
  matrixNew: IdMatrix;
  positionFrom: PointType;
  positionTo: PointType;
  lostRows: RowByAddress<Id>;
};

type HistoryAddRowType = {
  operation: "ADD_ROW";
  reflection?: StoreReflectionType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
};

type HistoryRemoveRowType = {
  operation: "REMOVE_ROW";
  reflection?: StoreReflectionType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
};

type HistoryAddColType = {
  operation: "ADD_COL";
  reflection?: StoreReflectionType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
};

type HistoryRemoveColType = {
  operation: "REMOVE_COL";
  reflection?: StoreReflectionType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
};

type HistoryNoOperation = {
  operation: "NO_OPERATION";
  reflection?: StoreReflectionType;
};

type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryCopyType
  | HistoryAddRowType
  | HistoryRemoveRowType
  | HistoryAddColType
  | HistoryRemoveColType
  | HistoryNoOperation;

export class History {
  public operation: HistoryType["operation"];
  public diffBefore?: DataType;
  public diffAfter?: DataType;
  public idMatrix?: IdMatrix;
  public position?: PointType;

  constructor(operation: HistoryType["operation"]) {
    this.operation = operation;
  }
}

type Props = {
  numRows?: number;
  numCols?: number;
  cells?: CellsType;
  parsers?: Parsers;
  renderers?: Renderers;
  labelers?: Labelers;
  useBigInt?: boolean;
  historyLimit?: number;
  minNumRows?: number;
  maxNumRows?: number;
  minNumCols?: number;
  maxNumCols?: number;
};

const cellFilter = (cell: CellType) => true;

type GetProps = {
  evaluates?: boolean;
  raise?: boolean;
  filter?: CellFilter;
};

type GetFlattenProps = GetProps & {
  key?: keyof CellType;
};

export class UserTable {
  public changedAt: Date;
  public lastChangedAt?: Date;
  protected head: bigint | number;
  protected idMatrix: IdMatrix;
  protected data: DataType;
  protected area: AreaType;
  protected parsers: Parsers;
  protected renderers: Renderers;
  protected labelers: Labelers;
  protected functions: FunctionMapping = {};
  protected base: UserTable;
  protected histories: HistoryType[];
  protected historyIndex: number;
  protected addressesById: { [id: Id]: Address };
  protected historyLimit: number;
  protected solvedCaches: { [address: Address]: any };
  public minNumRows: number;
  public maxNumRows: number;
  public minNumCols: number;
  public maxNumCols: number;

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
  }: Props) {
    this.head = useBigInt ? BigInt(0) : 0;
    this.data = new Map();
    this.area = { top: 0, left: 0, bottom: numRows, right: numCols };
    this.parsers = parsers;
    this.renderers = renderers;
    this.labelers = labelers;
    this.base = this;
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

    const common = cells.default;
    // make idMatrix beforehand
    for (let y = 0; y < numRows + 1; y++) {
      const ids: Ids = [];
      this.idMatrix.push(ids);
      for (let x = 0; x < numCols + 1; x++) {
        const id = (this.head++).toString(36);
        ids.push(id);
        const address = pointToAddress({ y, x });
        this.addressesById[id] = address;
      }
    }
    for (let y = 0; y < numRows + 1; y++) {
      const rowId = y2r(y);
      const rowDefault = cells[rowId];
      for (let x = 0; x < numCols + 1; x++) {
        const id = this.getId({ y, x });
        const address = pointToAddress({ y, x });
        const colId = x2c(x);
        const colDefault = cells[colId];
        const cell = cells[address];
        const value = convertFormulaAbsolute(cell?.value, Table.cast(this));
        const stacked = {
          ...common,
          ...rowDefault,
          ...colDefault,
          ...cell,
          value,
          style: {
            ...common?.style,
            ...rowDefault?.style,
            ...colDefault?.style,
            ...cell?.style,
          },
        } as CellType;
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
        this.data.set(id, stacked);
      }
    }
  }

  protected shallowCopy({ copyCache = true }: { copyCache?: boolean } = {}) {
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
    copied.base = this;
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
        const address = pointToAddress({ y, x });
        this.addressesById[existing] = address;
        if (existing === id) {
          const slidedAddress = pointToAddress({
            y: y + slideY,
            x: x + slideX,
          });
          return grantAddressAbsolute(slidedAddress, absCol, absRow);
        }
      }
    }
  }

  public getPointById(id: Id): PointType {
    const address = this.getAddressById(id);
    if (address) {
      return addressToPoint(address);
    }
    return { y: 0, x: 0 };
  }
  protected getId(point: PointType) {
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
    const value = this.data.get(id);
    return value;
  }

  public getById(id: Id) {
    return this.data.get(id);
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
  }: GetFlattenProps & {
    area?: AreaType;
  } = {}) {
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
              base: this.base as Table,
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
    const result: CellsType = {};
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          result[pointToAddress({ y, x })] = evaluates
            ? solveFormula({
                value: cell[key],
                base: this.base as Table,
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
    const result: CellsType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          row[x2c(x) || y2r(y)] = evaluates
            ? solveFormula({
                value: cell[key],
                base: this.base as Table,
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
    const result: CellsType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          col[y2r(y) || x2c(x)] = evaluates
            ? solveFormula({
                value: cell[key],
                base: this.base as Table,
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
  }: GetProps & {
    area?: AreaType;
  } = {}): (CellType | null)[][] {
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
                  base: this.base as Table,
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
    const result: CellsType = {};
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          result[pointToAddress({ y, x })] = {
            ...cell,
            value: evaluates
              ? solveFormula({
                  value: cell?.value,
                  base: this.base as Table,
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
    const result: CellsType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          row[x2c(x) || y2r(y)] = {
            ...cell,
            value: evaluates
              ? solveFormula({
                  value: cell?.value,
                  base: this.base as Table,
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
    const result: CellsType[] = [];
    const { top, left, bottom, right } = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getByPoint({ y: y - top, x: x - left });
        if (cell != null && filter(cell)) {
          col[y2r(y) || x2c(x)] = {
            ...cell,
            value: evaluates
              ? solveFormula({
                  value: cell?.value,
                  base: this.base as Table,
                  raise,
                })
              : cell?.value,
          };
        }
      }
    }
    return result;
  }

  protected pushHistory(history: HistoryType) {
    this.histories.splice(this.historyIndex + 1, this.histories.length);
    this.histories.push(history);
    if (this.histories.length > this.historyLimit) {
      const kickedOut = this.histories.splice(0, 1)[0];
      this.cleanObsolete(kickedOut);
    } else {
      this.historyIndex++;
    }
  }

  private cleanObsolete(history: HistoryType) {
    if (
      history.operation === "REMOVE_ROW" ||
      history.operation === "REMOVE_COL"
    ) {
      history.idMatrix.forEach((ids) => {
        ids.forEach((id) => {
          this.data.delete(id);
        });
      });
    }
    if (history.operation === "MOVE") {
      history.lostRows.forEach((ids) => {
        ids.forEach((id) => {
          this.data.delete(id);
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
        ids.push((this.head++).toString(36));
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

  private copyCell(cell: CellType | undefined, base: number) {
    if (cell == null) {
      return undefined;
    }
    const newCell: CellType = {};
    if (cell.style != null) {
      newCell.style = cell.style;
    }
    if (cell.verticalAlign != null) {
      newCell.verticalAlign = cell.verticalAlign;
    }
    if (cell.renderer != null) {
      newCell.renderer = cell.renderer;
    }
    if (cell.parser != null) {
      newCell.parser = cell.parser;
    }
    if (cell.width != null && base === 0) {
      newCell.width = cell.width;
    }
    if (cell.height != null && base === 0) {
      newCell.height = cell.height;
    }
    return newCell;
  }

  public move({
    src,
    dst,
    reflection = {},
  }: {
    src: AreaType;
    dst: AreaType;
    reflection?: StoreReflectionType;
  }) {
    const changedAt = new Date();
    const matrixFrom = this.getIdMatrixFromArea(src);
    const matrixTo = this.getIdMatrixFromArea(dst);
    const matrixNew = this.getNewIdMatrix(src);
    fillMatrix(this.idMatrix, matrixNew, src);
    matrixFrom.forEach((ids) => {
      ids
        .map(this.getById.bind(this))
        .filter((c) => c)
        .forEach((cell) => this.setChangedAt(cell, changedAt));
    });
    const lostRows = fillMatrix(this.idMatrix, matrixFrom, dst);
    this.pushHistory({
      operation: "MOVE",
      reflection,
      matrixFrom,
      matrixTo,
      matrixNew,
      positionFrom: { y: src.top, x: src.left },
      positionTo: { y: dst.top, x: dst.left },
      lostRows,
    });
    return this.shallowCopy({ copyCache: false });
  }

  public copy({
    src,
    dst,
    reflection = {},
  }: {
    src: AreaType;
    dst: AreaType;
    reflection?: StoreReflectionType;
  }) {
    const { height: maxHeight, width: maxWidth } = areaShape(src, 1);
    const { top: topFrom, left: leftFrom } = src;
    const { top: topTo, left: leftTo, bottom: bottomTo, right: rightTo } = dst;
    const diff: DiffType = {};
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
        const cell = this.getByPoint({
          y: topFrom + (i % maxHeight),
          x: leftFrom + (j % maxWidth),
        });
        const value = convertFormulaAbsolute(
          cell?.value,
          Table.cast(this),
          slideY,
          slideX
        );
        this.setChangedAt(cell, changedAt);
        diff[pointToAddress({ y: toY, x: toX })] = {
          ...cell,
          style: { ...cell?.style },
          value,
        };
      }
    }
    return this.update({ diff, partial: false, reflection });
  }

  public update({
    diff,
    partial = true,
    updateChangedAt = true,
    reflection = {},
  }: {
    diff: DiffType;
    partial?: boolean;
    updateChangedAt?: boolean;
    reflection?: StoreReflectionType;
  }) {
    const diffBefore: DataType = new Map();
    const diffAfter: DataType = new Map();
    const changedAt = new Date();
    Object.keys(diff).forEach((address) => {
      const cell = { ...diff[address] };
      if (updateChangedAt) {
        this.setChangedAt(cell, changedAt);
      }
      cell.value = convertFormulaAbsolute(cell.value, Table.cast(this));
      const point = addressToPoint(address);
      const id = this.getId(point);
      diffBefore.set(id, this.getByPoint(point));
      diffAfter.set(id, cell);
      if (partial) {
        this.data.set(id, { ...this.data.get(id), ...cell });
      } else {
        this.data.set(id, cell);
      }
    });
    this.pushHistory({
      operation: "UPDATE",
      reflection,
      diffBefore,
      diffAfter,
      partial,
    });
    this.solvedCaches = {};
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
    const diff: DiffType = {};
    matrix.map((cols, i) => {
      const y = baseY + i;
      if (y > this.bottom) {
        return;
      }
      cols.map((value, j) => {
        const x = baseX + j;
        if (x > this.right) {
          return;
        }
        const cell = this.parse({ y, x }, value);
        diff[pointToAddress({ y, x })] = cell;
      });
    });
    return this.update({ diff, partial: true, updateChangedAt, reflection });
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

  protected parse(point: PointType, value: string) {
    const cell = this.getByPoint(point) || {};
    const parser = this.parsers[cell.parser || ""] || defaultParser;
    return parser.parse(value, cell);
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
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.head++;
        row.push(id.toString(36));
        const cell = this.getByPoint({ y: baseY, x: j });
        const copied = this.copyCell(cell, baseY);
        this.data.set(id.toString(36), copied);
      }
      rows.push(row);
    }
    this.idMatrix.splice(y, 0, ...rows);
    this.area.bottom += numRows;
    this.pushHistory({
      operation: "ADD_ROW",
      reflection,
      y,
      numRows,
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
      operation: "REMOVE_ROW",
      reflection,
      y,
      numRows,
      idMatrix: rows,
    });
    return this.shallowCopy({ copyCache: false });
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
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.head++;
        row.push(id.toString(36));
        const cell = this.getByPoint({ y: i, x: baseX });
        const copied = this.copyCell(cell, baseX);
        this.idMatrix[i].splice(x, 0, id.toString(36));
        this.data.set(id.toString(36), copied);
      }
      rows.push(row);
    }
    this.area.right += numCols;
    this.pushHistory({
      operation: "ADD_COL",
      reflection,
      x,
      numCols,
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
    this.idMatrix.map((row) => {
      const deleted = row.splice(x, numCols);
      rows.push(deleted);
    });
    this.area.right -= numCols;
    this.pushHistory({
      operation: "REMOVE_COL",
      reflection,
      x,
      numCols,
      idMatrix: rows,
    });
    return this.shallowCopy({ copyCache: false });
  }
}

export class Table extends UserTable {
  static cast(userTable: UserTable) {
    return userTable as Table;
  }

  public setFunctions(additionalFunctions: FunctionMapping) {
    this.functions = { ...functions, ...additionalFunctions };
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
          solveFormula({ value: s, base: this.base as Table, raise: false })
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
    copied.base = this.base;
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
    const { y, x } = addressToPoint(address);
    const id = this.getId({ y: Math.abs(y), x: Math.abs(x) });
    if (id) {
      return `#${x < 0 ? "$" : ""}${id}${y < 0 ? "$" : ""}`;
    }
  }

  private applyDiff(diff: DataType, partial = true) {
    diff.forEach((cell, id) => {
      if (partial) {
        this.data.set(id, { ...this.getById(id), ...cell });
      } else {
        this.data.set(id, cell);
      }
    });
  }

  public undo() {
    if (this.historyIndex < 0) {
      return { history: null, newTable: this as Table };
    }
    const history = this.histories[this.historyIndex--];
    switch (history.operation) {
      case "UPDATE":
        this.applyDiff(history.diffBefore!, history.partial);
        break;
      case "ADD_ROW":
        this.idMatrix.splice(history.y, history.numRows);
        this.area.bottom -= history.numRows;
        break;
      case "ADD_COL":
        this.idMatrix.map((row) => {
          row.splice(history.x, history.numCols);
        });
        this.area.right -= history.numCols;
        break;
      case "REMOVE_ROW":
        this.idMatrix.splice(history.y, 0, ...history.idMatrix);
        this.area.bottom += history.numRows;
        break;
      case "REMOVE_COL":
        this.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area.right += history.numCols;
        break;
      case "MOVE":
        const { y: yFrom, x: xFrom } = history.positionFrom;
        const { y: yTo, x: xTo } = history.positionTo;
        const { height: rows, width: cols } = matrixShape(
          history.matrixFrom,
          -1
        );
        fillMatrix(this.idMatrix, history.matrixFrom, {
          top: yFrom,
          left: xFrom,
          bottom: yFrom + rows,
          right: xFrom + cols,
        });
        fillMatrix(this.idMatrix, history.matrixTo, {
          top: yTo,
          left: xTo,
          bottom: yTo + rows,
          right: xTo + cols,
        });
        break;
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
      case "ADD_ROW":
        this.idMatrix.splice(history.y, 0, ...history.idMatrix);
        this.area.bottom += history.numRows;
        break;
      case "ADD_COL":
        this.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area.right += history.numCols;
        break;
      case "REMOVE_ROW":
        this.idMatrix.splice(history.y, history.numRows);
        this.area.bottom -= history.numRows;
        break;
      case "REMOVE_COL":
        this.idMatrix.map((row) => {
          row.splice(history.x, history.numCols);
        });
        this.area.right -= history.numCols;
        break;
      case "MOVE":
        const { y: yFrom, x: xFrom } = history.positionFrom;
        const { y: yTo, x: xTo } = history.positionTo;
        const { height: rows, width: cols } = matrixShape(
          history.matrixFrom,
          -1
        );
        fillMatrix(this.idMatrix, history.matrixNew, {
          top: yFrom,
          left: xFrom,
          bottom: yFrom + rows,
          right: xFrom + cols,
        });
        fillMatrix(this.idMatrix, history.matrixFrom, {
          top: yTo,
          left: xTo,
          bottom: yTo + rows,
          right: xTo + cols,
        });
    }
    return {
      history,
      newTable: this.shallowCopy({
        copyCache: !shouldTracking(history.operation),
      }),
    };
  }
  getFunction(name: string) {
    return this.functions[name];
  }
  getHistoryIndex() {
    return this.historyIndex;
  }
  getHistoryLimit() {
    return this.historyLimit;
  }
  getHistorySize() {
    return this.histories.length;
  }
  getLabel(key: string, n: number) {
    const labeler = this.labelers[key];
    return labeler?.(n);
  }
  getBase() {
    return this.base as Table;
  }
  getSolvedCache(key: string) {
    return this.solvedCaches[key];
  }
  setSolvedCache(key: string, value: any) {
    this.solvedCaches[key] = value;
  }
}

// just using as a type
export class ReadonlyTable extends Table {}
