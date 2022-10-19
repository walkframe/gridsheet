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
  HistoryOperationType,
  RowByAddress,
  CellFilter,
  Labelers,
} from "../types";
import { CellsType, CellType, Parsers, Renderers } from "../types";
import { createMatrix, matrixShape, writeMatrix, zoneShape } from "./matrix";
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
import { Area, HISTORY_LIMIT } from "../constants";
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

type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryCopyType
  | HistoryAddRowType
  | HistoryRemoveRowType
  | HistoryAddColType
  | HistoryRemoveColType;

export class History {
  public operation: HistoryOperationType;
  public diffBefore?: DataType;
  public diffAfter?: DataType;
  public idMatrix?: IdMatrix;
  public position?: PointType;

  constructor(operation: HistoryOperationType) {
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
};

const cellFilter = (cell: CellType) => true;

type GetProps = {
  evaluates?: boolean;
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
  protected idCache: Map<Id, string>;
  protected historyLimit: number;

  constructor({
    numRows = 0,
    numCols = 0,
    cells = {},
    parsers = {},
    renderers = {},
    labelers = {},
    useBigInt = false,
    historyLimit: historyLimit = HISTORY_LIMIT,
  }: Props) {
    this.head = useBigInt ? BigInt(0) : 0;
    this.data = new Map();
    this.area = [0, 0, numRows, numCols];
    this.parsers = parsers;
    this.renderers = renderers;
    this.labelers = labelers;
    this.base = this;
    this.idMatrix = [];
    this.histories = [];
    this.historyIndex = -1;
    this.idCache = new Map();
    this.historyLimit = historyLimit;
    this.changedAt = new Date();

    const common = cells.default;
    // make idMatrix beforehand
    for (let y = 0; y < numRows + 1; y++) {
      const ids: Ids = [];
      this.idMatrix.push(ids);
      for (let x = 0; x < numCols + 1; x++) {
        const id = (this.head++).toString(36);
        ids.push(id);
        const address = pointToAddress([y, x]);
        this.idCache.set(id, address);
      }
    }
    for (let y = 0; y < numRows + 1; y++) {
      const ids: Ids = [];
      const rowId = y2r(y);
      const rowDefault = cells[rowId];
      this.idMatrix.push(ids);
      for (let x = 0; x < numCols + 1; x++) {
        const id = this.getId([y, x]);
        const address = pointToAddress([y, x]);
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
        if (y > 0 && x > 0) {
          delete stacked.height;
          delete stacked.width;
          delete stacked.labeler;
        }
        this.data.set(id, stacked);
      }
    }
  }

  protected shallowCopy(copyCache = true) {
    const copied = new Table({ numRows: 0, numCols: 0 });
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
    copied.base = this;
    if (copyCache) {
      copied.idCache = this.idCache;
    }
    return copied;
  }

  public getAddressById(id: Id, slideY = 0, slideX = 0) {
    const absCol = id.startsWith("$");
    if (absCol) {
      id = id.slice(1);
    }
    const absRow = id.endsWith("$");
    if (absRow) {
      id = id.slice(0, -1);
    }
    const address = this.idCache.get(id);
    if (address && slideY === 0 && slideX === 0) {
      return grantAddressAbsolute(address, absCol, absRow);
    }
    for (let y = 0; y < this.idMatrix.length; y++) {
      const ids = this.idMatrix[y];
      for (let x = 0; x < ids.length; x++) {
        const existing = ids[x];
        const address = pointToAddress([y, x]);
        this.idCache.set(existing, address);
        if (existing === id) {
          const slidedAddress = pointToAddress([y + slideY, x + slideX]);
          return grantAddressAbsolute(slidedAddress, absCol, absRow);
        }
      }
    }
  }

  public getPointById(id: Id) {
    const address = this.getAddressById(id);
    if (address) {
      return addressToPoint(address);
    }
    return [0, 0];
  }
  protected getId(point: PointType) {
    const [y, x] = point;
    return this.idMatrix[y]?.[x];
  }

  public getByPoint(point: PointType) {
    const [y, x] = point;
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
    const [top, left, bottom, right] = this.area;
    return base + bottom - top;
  }

  public getNumCols(base = 0) {
    const [top, left, bottom, right] = this.area;
    return base + right - left;
  }

  public getMatrixFlatten({
    area,
    key = "value",
    evaluates = true,
    filter = cellFilter,
  }: GetFlattenProps & {
    area?: AreaType;
  } = {}) {
    const [top, left, bottom, right] = area || [
      1,
      1,
      this.area[Area.Bottom],
      this.area[Area.Right],
    ];
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint([y, x]) || {};
        if (!filter(cell)) {
          continue;
        }
        matrix[y - top][x - left] = evaluates
          ? solveFormula(cell[key], this.base as Table, false)
          : cell[key];
      }
    }
    return matrix;
  }
  public getObjectFlatten({
    key = "value",
    evaluates = true,
    filter = cellFilter,
  }: GetFlattenProps = {}) {
    const result: CellsType = {};
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint([y - top, x - left]);
        if (cell != null && filter(cell)) {
          result[pointToAddress([y, x])] = evaluates
            ? solveFormula(cell[key], this.base as Table, false)
            : cell[key];
        }
      }
    }
    return result;
  }
  public getRowsFlatten({
    key = "value",
    evaluates = true,
    filter = cellFilter,
  }: GetFlattenProps = {}) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint([y - top, x - left]);
        if (cell != null && filter(cell)) {
          row[x2c(x) || y2r(y)] = evaluates
            ? solveFormula(cell[key], this.base as Table, false)
            : cell[key];
        }
      }
    }
    return result;
  }
  public getColsFlatten({
    key = "value",
    evaluates = true,
    filter = cellFilter,
  }: GetFlattenProps = {}) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getByPoint([y - top, x - left]);
        if (cell != null && filter(cell)) {
          col[y2r(y) || x2c(x)] = evaluates
            ? solveFormula(cell[key], this.base as Table, false)
            : cell[key];
        }
      }
    }
    return result;
  }
  public getMatrix({
    area,
    evaluates = true,
    filter = cellFilter,
  }: GetProps & {
    area?: AreaType;
  } = {}): (CellType | null)[][] {
    const [top, left, bottom, right] = area || [
      1,
      1,
      this.area[Area.Bottom],
      this.area[Area.Right],
    ];
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint([y, x]);
        if (cell != null && filter(cell)) {
          matrix[y - top][x - left] = {
            ...cell,
            value: evaluates
              ? solveFormula(cell?.value, this.base as Table, false)
              : cell?.value,
          };
        }
      }
    }
    return matrix;
  }
  public getObject({ evaluates = true, filter = cellFilter }: GetProps = {}) {
    const result: CellsType = {};
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint([y - top, x - left]);
        if (cell != null && filter(cell)) {
          result[pointToAddress([y, x])] = {
            ...cell,
            value: evaluates
              ? solveFormula(cell?.value, this.base as Table, false)
              : cell?.value,
          };
        }
      }
    }
    return result;
  }
  public getRows({ evaluates = true, filter = cellFilter }: GetProps = {}) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getByPoint([y - top, x - left]);
        if (cell != null && filter(cell)) {
          row[x2c(x) || y2r(y)] = {
            ...cell,
            value: evaluates
              ? solveFormula(cell?.value, this.base as Table, false)
              : cell?.value,
          };
        }
      }
    }
    return result;
  }
  public getCols({ evaluates = true, filter = cellFilter }: GetProps = {}) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getByPoint([y - top, x - left]);
        if (cell != null && filter(cell)) {
          col[y2r(y) || x2c(x)] = {
            ...cell,
            value: evaluates
              ? solveFormula(cell?.value, this.base as Table, false)
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
    const [top, left, bottom, right] = area;
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
    const [top, left, bottom, right] = area;
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

  public move(
    from: AreaType,
    to: AreaType,
    reflection: StoreReflectionType = {}
  ) {
    const now = new Date();
    const matrixFrom = this.getIdMatrixFromArea(from);
    const matrixTo = this.getIdMatrixFromArea(to);
    const matrixNew = this.getNewIdMatrix(from);
    writeMatrix(this.idMatrix, matrixNew, from);
    matrixFrom.forEach((ids) => {
      ids
        .map(this.getById.bind(this))
        .filter((c) => c)
        .forEach((cell) => (cell!.changedAt = now));
    });
    const lostRows = writeMatrix(this.idMatrix, matrixFrom, to);
    this.pushHistory({
      operation: "MOVE",
      reflection,
      matrixFrom,
      matrixTo,
      matrixNew,
      positionFrom: [from[0], from[1]],
      positionTo: [to[0], to[1]],
      lostRows,
    });
    return this.shallowCopy(false);
  }

  public copy(
    from: AreaType,
    to: AreaType,
    reflection: StoreReflectionType = {}
  ) {
    const now = new Date();
    const [maxHeight, maxWidth] = zoneShape(from, 1);
    const [topFrom, leftFrom, bottomFrom, rightFrom] = from;
    const [topTo, leftTo, bottomTo, rightTo] = to;
    const diff: DiffType = {};

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
        const cell = this.getByPoint([
          topFrom + (i % maxHeight),
          leftFrom + (j % maxWidth),
        ]);
        const value = convertFormulaAbsolute(
          cell?.value,
          Table.cast(this),
          slideY,
          slideX
        );
        diff[pointToAddress([toY, toX])] = {
          ...cell,
          value,
          changedAt: now,
        };
      }
    }
    return this.update(diff, false, reflection);
  }

  public update(
    diff: DiffType,
    partial = true,
    reflection: StoreReflectionType = {}
  ) {
    const diffBefore: DataType = new Map();
    const diffAfter: DataType = new Map();
    const changedAt = new Date();
    Object.keys(diff).forEach((address) => {
      const value = convertFormulaAbsolute(diff[address], Table.cast(this));
      const point = addressToPoint(address);
      const id = this.getId(point);
      diffBefore.set(id, this.getByPoint(point));
      diffAfter.set(id, value);
      if (partial) {
        this.data.set(id, { ...this.data.get(id), ...value, changedAt });
      } else {
        this.data.set(id, { ...value, changedAt });
      }
    });
    this.pushHistory({
      operation: "UPDATE",
      reflection,
      diffBefore,
      diffAfter,
      partial,
    });
    return this.shallowCopy(true);
  }

  public addRows(
    y: number,
    numRows: number,
    baseY: number,
    reflection: StoreReflectionType = {}
  ) {
    const numCols = this.getNumCols(1);
    const rows: IdMatrix = [];
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.head++;
        row.push(id.toString(36));
        const cell = this.getByPoint([baseY, j]);
        const copied = this.copyCell(cell, baseY);
        this.data.set(id.toString(36), copied);
      }
      rows.push(row);
    }
    this.idMatrix.splice(y, 0, ...rows);
    this.area[Area.Bottom] += numRows;
    this.pushHistory({
      operation: "ADD_ROW",
      reflection,
      y,
      numRows,
      idMatrix: rows,
    });
    return this.shallowCopy(false);
  }
  public removeRows(
    y: number,
    numRows: number,
    reflection: StoreReflectionType = {}
  ) {
    const rows = this.idMatrix.splice(y, numRows);
    this.area[Area.Bottom] -= numRows;
    this.pushHistory({
      operation: "REMOVE_ROW",
      reflection,
      y,
      numRows,
      idMatrix: rows,
    });
    return this.shallowCopy(false);
  }
  public addCols(
    x: number,
    numCols: number,
    baseX: number,
    reflection: StoreReflectionType = {}
  ) {
    const numRows = this.getNumRows(1);
    const rows: IdMatrix = [];
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.head++;
        row.push(id.toString(36));
        const cell = this.getByPoint([i, baseX]);
        const copied = this.copyCell(cell, baseX);
        this.idMatrix[i].splice(x, 0, id.toString(36));
        this.data.set(id.toString(36), copied);
      }
      rows.push(row);
    }
    this.area[Area.Right] += numCols;
    this.pushHistory({
      operation: "ADD_COL",
      reflection,
      x,
      numCols,
      idMatrix: rows,
    });
    return this.shallowCopy(false);
  }
  public removeCols(
    x: number,
    numCols: number,
    reflection: StoreReflectionType = {}
  ) {
    const rows: IdMatrix = [];
    this.idMatrix.map((row) => {
      const deleted = row.splice(x, numCols);
      rows.push(deleted);
    });
    this.area[Area.Right] -= numCols;
    this.pushHistory({
      operation: "REMOVE_COL",
      reflection,
      x,
      numCols,
      idMatrix: rows,
    });
    return this.shallowCopy(false);
  }
}

export class Table extends UserTable {
  static cast(userTable: UserTable) {
    return userTable as Table;
  }

  public setFunctions(additionalFunctions: FunctionMapping) {
    // @ts-ignore
    this.functions = { ...functions, ...additionalFunctions };
  }

  public getTop() {
    return this.area[Area.Top];
  }
  public getLeft() {
    return this.area[Area.Left];
  }
  public getBottom() {
    return this.area[Area.Bottom];
  }
  public getRight() {
    return this.area[Area.Right];
  }
  public getArea(): AreaType {
    return [...this.area];
  }

  public parse(position: PointType, value: string) {
    const cell = this.getByPoint(position) || {};
    const parser = this.parsers[cell.parser || ""] || defaultParser;
    return parser.parse(value, cell);
  }

  public render(position: PointType, writer?: WriterType) {
    const cell = this.getByPoint(position) || {};
    const renderer = this.renderers[cell.renderer || ""] || defaultRenderer;
    return renderer.render(this, position, writer);
  }

  public stringify(position: PointType, value?: any) {
    const cell = this.getByPoint(position);
    const renderer = this.renderers[cell?.renderer || ""] || defaultRenderer;
    if (typeof value === "undefined") {
      return renderer.stringify(cell || {});
    }
    const s = renderer.stringify({ ...cell, value });

    if (s[0] === "=") {
      const lexer = new Lexer(s.substring(1));
      lexer.tokenize();
      return "=" + lexer.stringify("REF", this);
    }
    return s;
  }

  public trim(area?: AreaType) {
    const copied = new Table({ numRows: 0, numCols: 0 });
    if (area != null) {
      copied.area = area;
      copied.base = this.base;
    } else {
      copied.area = [...this.area];
      copied.base = this;
    }
    copied.idMatrix = this.idMatrix;
    copied.data = this.data;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    copied.labelers = this.labelers;
    copied.functions = this.functions;
    copied.histories = this.histories;
    copied.historyLimit = this.historyLimit;
    copied.historyIndex = this.historyIndex;
    copied.idCache = this.idCache;
    return copied;
  }

  public getIdByAddress(address: Address) {
    const [y, x] = addressToPoint(address);
    const id = this.getId([Math.abs(y), Math.abs(x)]);
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

  private getDiffByPos(position: PointType, cell: CellType) {
    const diff: DataType = new Map();
    const id = this.getId(position);
    diff.set(id, cell);
    return diff;
  }

  private createBackDiff(area: AreaType) {
    const backdiff: DataType = new Map();
    const [top, left, bottom, right] = area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const id = this.getId([y, x]);
        backdiff.set(id, this.getByPoint([y, x]));
      }
    }
    return backdiff;
  }

  private put(position: PointType, cell: CellType) {
    const changedAt = new Date();
    const [y, x] = position;
    const [numRows, numCols] = [this.getNumRows(1), this.getNumCols(1)];
    const modY = y % numRows;
    const modX = x % numCols;
    const id = this.getId([modY, modX]);
    const value = convertFormulaAbsolute(cell.value, Table.cast(this));
    this.data.set(id, { ...cell, value, changedAt });
  }

  public write(
    position: PointType,
    value: any,
    reflection: StoreReflectionType = {}
  ) {
    const [y, x] = position;
    const cell = this.parse([y, x], value);
    this.pushHistory({
      operation: "UPDATE",
      reflection,
      diffBefore: this.createBackDiff([y, x, y, x]),
      diffAfter: this.getDiffByPos([y, x], cell),
      partial: true,
    });
    this.put([y, x], cell);
    return this.shallowCopy(true);
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
        this.area[Area.Bottom] -= history.numRows;
        break;
      case "ADD_COL":
        this.idMatrix.map((row) => {
          row.splice(history.x, history.numCols);
        });
        this.area[Area.Right] -= history.numCols;
        break;
      case "REMOVE_ROW":
        this.idMatrix.splice(history.y, 0, ...history.idMatrix);
        this.area[Area.Bottom] += history.numRows;
        break;
      case "REMOVE_COL":
        this.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area[Area.Right] += history.numCols;
        break;
      case "MOVE":
        const [yFrom, xFrom] = history.positionFrom;
        const [yTo, xTo] = history.positionTo;
        const [rows, cols] = matrixShape(history.matrixFrom, -1);
        writeMatrix(this.idMatrix, history.matrixFrom, [
          yFrom,
          xFrom,
          yFrom + rows,
          xFrom + cols,
        ]);
        writeMatrix(this.idMatrix, history.matrixTo, [
          yTo,
          xTo,
          yTo + rows,
          xTo + cols,
        ]);
        break;
    }
    return {
      history,
      newTable: this.shallowCopy(!shouldTracking(history.operation)),
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
        this.area[Area.Bottom] += history.numRows;
        break;
      case "ADD_COL":
        this.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area[Area.Right] += history.numCols;
        break;
      case "REMOVE_ROW":
        this.idMatrix.splice(history.y, history.numRows);
        this.area[Area.Bottom] -= history.numRows;
        break;
      case "REMOVE_COL":
        this.idMatrix.map((row) => {
          row.splice(history.x, history.numCols);
        });
        this.area[Area.Right] -= history.numCols;
        break;
      case "MOVE":
        const [yFrom, xFrom] = history.positionFrom;
        const [yTo, xTo] = history.positionTo;
        const [rows, cols] = matrixShape(history.matrixFrom, -1);
        writeMatrix(this.idMatrix, history.matrixNew, [
          yFrom,
          xFrom,
          yFrom + rows,
          xFrom + cols,
        ]);
        writeMatrix(this.idMatrix, history.matrixFrom, [
          yTo,
          xTo,
          yTo + rows,
          xTo + cols,
        ]);
    }
    return {
      history,
      newTable: this.shallowCopy(!shouldTracking(history.operation)),
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
  label(key: string, n: number) {
    const labeler = this.labelers[key];
    return labeler?.(n);
  }
}
