import { defaultParser } from "../parsers/core";
import { defaultRenderer } from "../renderers/core";
import {
  Id,
  Ids,
  IdMatrix,
  AreaType,
  DataType,
  DiffType,
  PositionType,
  WriterType,
  ZoneType,
  Address,
} from "../types";
import { CellsType, CellType, Parsers, Renderers } from "../types";
import { createMatrix, writeMatrix } from "./matrix";
import { addressToPoint, n2a, x2c, xy2cell, y2r } from "./converters";
import { FunctionMapping } from "../formula/functions/__base";
import { functions } from "../formula/mapping";
import { Lexer, solveFormula } from "../formula/evaluator";

type Props = {
  numRows: number;
  numCols: number;
  cells?: CellsType;
  parsers?: Parsers;
  renderers?: Renderers;
  useBigInt?: boolean;
  historySize?: number;
};

type HistoryOperationType =
  | "WRITE"
  | "COPY"
  | "CUT"
  | "ADD_ROW"
  | "ADD_COL"
  | "REMOVE_ROW"
  | "REMOVE_COL";

type StoreFeedbackType = {
  choosing?: PositionType;
  cutting?: boolean;
  copyingZone?: ZoneType;
  selectingZone?: ZoneType | undefined;
};

type HistoryUpdateType = {
  operation: "UPDATE";
  diffBefore: DataType;
  diffAfter: DataType;
  partial: boolean;
  feedback?: StoreFeedbackType;
};

type HistoryCopyType = {
  operation: "COPY";
  diffBefore: DataType;
  diffAfter: DataType;
  area: AreaType;
};

type HistoryCutType = {
  operation: "CUT";
  diffBefore: DataType;
  diffAfter: DataType;
  area: AreaType;
};

type HistoryAddRowType = {
  operation: "ADD_ROW";
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
  feedback?: StoreFeedbackType;
};

type HistoryRemoveRowType = {
  operation: "REMOVE_ROW";
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
  feedback?: StoreFeedbackType;
};

type HistoryAddColType = {
  operation: "ADD_COL";
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
  feedback?: StoreFeedbackType;
};

type HistoryRemoveColType = {
  operation: "REMOVE_COL";
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
  feedback?: StoreFeedbackType;
};

type HistoryType =
  | HistoryUpdateType
  | HistoryCutType
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
  public position?: PositionType;

  constructor(operation: HistoryOperationType) {
    this.operation = operation;
  }
}

export class UserTable {
  protected head: Id;
  protected idMatrix: IdMatrix;
  protected data: DataType;
  protected area: AreaType;
  protected parsers: Parsers;
  protected renderers: Renderers;
  public functions: FunctionMapping = {};
  protected base: UserTable;
  protected histories: HistoryType[];
  protected historyIndex: number;
  protected idCache: Map<Id, string>;
  public historySize: number;

  constructor({
    numRows,
    numCols,
    cells = {},
    parsers = {},
    renderers = {},
    useBigInt = false,
    historySize = 10,
  }: Props) {
    this.head = useBigInt ? BigInt(0) : 0;
    this.data = new Map();
    this.area = [0, 0, numRows, numCols];
    this.parsers = parsers;
    this.renderers = renderers;
    this.base = this;
    this.idMatrix = [];
    this.histories = [];
    this.historyIndex = -1;
    this.idCache = new Map();
    this.historySize = historySize;

    const common = cells.default;
    for (let y = 0; y < numRows + 1; y++) {
      const ids: Ids = [];
      const rowId = y2r(y);
      const rowDefault = cells[rowId];
      this.idMatrix.push(ids);
      for (let x = 0; x < numCols + 1; x++) {
        const id = this.head++;
        ids.push(id);
        const address = xy2cell(x, y);
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
        if (y > 0 && x > 0) {
          delete stacked.height;
          delete stacked.width;
          delete stacked.label;
        }
        this.data.set(id, stacked);
      }
    }
  }

  public getIdByAddress(address: Address) {
    const [y, x] = addressToPoint(address);
    const id = this.getId(y, x);
    this.idCache.set(id, address);
    return id;
  }
  public getAddressById(id: Id) {
    const address = this.idCache.get(id);
    if (address) {
      return address;
    }
    for (let y = 0; y < this.idMatrix.length; y++) {
      const ids = this.idMatrix[y];
      for (let x = 0; x < ids.length; x++) {
        const existing = ids[x];
        const address = xy2cell(x, y);
        this.idCache.set(existing, address);
        if (existing === id) {
          return address;
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
  public getId(y: number, x: number) {
    return this.idMatrix[y][x];
  }

  public get(y: number, x: number) {
    if (y === -1 || x === -1) {
      return undefined;
    }
    const id = this.idMatrix[y][x];
    const value = this.data.get(id);
    return value;
  }

  public getById(id: Id) {
    return this.data.get(id);
  }

  public numRows(base = 0) {
    const [top, left, bottom, right] = this.area;
    return base + bottom - top;
  }

  public numCols(base = 0) {
    const [top, left, bottom, right] = this.area;
    return base + right - left;
  }

  public matrixFlatten(
    area?: AreaType,
    key: keyof CellType = "value",
    evaluates = true
  ) {
    const [top, left, bottom, right] = area || [
      1,
      1,
      this.area[2],
      this.area[3],
    ];
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y, x) || {};
        matrix[y - top][x - left] = evaluates
          ? solveFormula(cell[key], this.base, false)
          : cell[key];
      }
    }
    return matrix;
  }
  public objectFlatten(key: keyof CellType = "value", evaluates = true) {
    const result: CellsType = {};
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          result[xy2cell(x, y)] = evaluates
            ? solveFormula(cell[key], this.base, false)
            : cell[key];
        }
      }
    }
    return result;
  }
  public rowsFlatten(key: keyof CellType = "value", evaluates = true) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          row[x2c(x) || y2r(y)] = evaluates
            ? solveFormula(cell[key], this.base, false)
            : cell[key];
        }
      }
    }
    return result;
  }
  public colsFlatten(key: keyof CellType = "value", evaluates = true) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          col[y2r(y) || x2c(x)] = evaluates
            ? solveFormula(cell[key], this.base, false)
            : cell[key];
        }
      }
    }
    return result;
  }
  public matrix(area?: AreaType, evaluates = true) {
    const [top, left, bottom, right] = area || [
      1,
      1,
      this.area[2],
      this.area[3],
    ];
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y, x);
        matrix[y - top][x - left] = {
          ...cell,
          value: evaluates
            ? solveFormula(cell?.value, this.base, false)
            : cell?.value,
        };
      }
    }
    return matrix;
  }
  public object(evaluates = true) {
    const result: CellsType = {};
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          result[xy2cell(x, y)] = {
            ...cell,
            value: evaluates
              ? solveFormula(cell?.value, this.base, false)
              : cell?.value,
          };
        }
      }
    }
    return result;
  }
  public rows(evaluates = true) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          row[x2c(x) || y2r(y)] = {
            ...cell,
            value: evaluates
              ? solveFormula(cell?.value, this.base, false)
              : cell?.value,
          };
        }
      }
    }
    return result;
  }
  public cols(evaluates = true) {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          col[y2r(y) || x2c(x)] = {
            ...cell,
            value: evaluates
              ? solveFormula(cell?.value, this.base, false)
              : cell?.value,
          };
        }
      }
    }
    return result;
  }
  public complementRange(range: string) {
    const cells = range.split(":");
    let [start = "", end = ""] = cells;
    if (!start.match(/[1-9]\d*/)) {
      start += "1";
    }
    if (!start.match(/[a-zA-Z]/)) {
      start = "A" + start;
    }
    if (!end.match(/[1-9]\d*/)) {
      end += this.numRows();
    }
    if (!end.match(/[a-zA-Z]/)) {
      end = n2a(this.numCols() + 1) + end;
    }
    return `${start}:${end}`;
  }
  public top() {
    return this.area[0];
  }
  public left() {
    return this.area[1];
  }
  public bottom() {
    return this.area[2];
  }
  public right() {
    return this.area[3];
  }
  public getArea(): AreaType {
    return [...this.area];
  }
  public parse(y: number, x: number, value: string) {
    const cell = this.get(y, x) || {};
    const parser = this.parsers[cell.parser || ""] || defaultParser;
    return parser.parse(value, cell, this);
  }
  public render(y: number, x: number, writer?: WriterType) {
    const cell = this.get(y, x) || {};
    const renderer = this.renderers[cell.renderer || ""] || defaultRenderer;
    return renderer.render(this, y, x, writer);
  }
  public stringify(y: number, x: number, value?: any, replaceRef = true) {
    const cell = this.get(y, x);
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

  public copy(area?: AreaType) {
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
    copied.functions = this.functions;
    copied.histories = this.histories;
    copied.historySize = this.historySize;
    copied.historyIndex = this.historyIndex;
    return copied;
  }
}

export class Table extends UserTable {
  public setFunctions(additionalFunctions: FunctionMapping) {
    // @ts-ignore
    this.functions = { ...functions, ...additionalFunctions };
  }

  public shallowCopy() {
    const copied = new Table({ numRows: 0, numCols: 0 });
    copied.head = this.head;
    copied.idMatrix = this.idMatrix;
    copied.data = this.data;
    copied.area = this.area;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    copied.functions = this.functions;
    copied.histories = this.histories;
    copied.historySize = this.historySize;
    copied.historyIndex = this.historyIndex;
    copied.base = this;
    return copied;
  }

  public update(diff: DataType, partial = true) {
    diff.forEach((cell, id) => {
      if (partial) {
        this.data.set(id, { ...this.getById(id), ...cell });
      } else {
        this.data.set(id, cell);
      }
    });
  }

  public pushHistory(history: HistoryType) {
    this.histories.splice(this.historyIndex + 1, this.histories.length);
    this.histories.push(history);
    if (this.histories.length > this.historySize) {
      this.histories.splice(0, 1);
    } else {
      this.historyIndex++;
    }
  }

  public getDiffByPos(y: number, x: number, cell: CellType) {
    const diff: DataType = new Map();
    const id = this.getId(y, x);
    diff.set(id, cell);
    return diff;
  }

  public createBackDiff(area: AreaType) {
    const backdiff: DataType = new Map();
    const [top, left, bottom, right] = area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const id = this.getId(y, x);
        backdiff.set(id, this.get(y, x));
      }
    }
    return backdiff;
  }

  public put(y: number, x: number, cell: CellType) {
    const [numRows, numCols] = [this.numRows(1), this.numCols(1)];
    const modY = y % numRows;
    const modX = x % numCols;
    const id = this.getId(modY, modX);
    this.data.set(id, cell);
  }

  public write(y: number, x: number, value: any, feedback: StoreFeedbackType) {
    const cell = this.parse(y, x, value);
    this.pushHistory({
      operation: "UPDATE",
      diffBefore: this.createBackDiff([y, x, y, x]),
      diffAfter: this.getDiffByPos(y, x, cell),
      partial: true,
      feedback,
    });
    this.put(y, x, cell);
  }

  public copyCell(cell: CellType | undefined, base: number) {
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

  public applyDiff(
    diff: DiffType,
    partial = true,
    feedback: StoreFeedbackType = {}
  ) {
    const diffBefore = new Map();
    const diffAfter = new Map();
    Object.keys(diff).map((address) => {
      const value = diff[address];
      const [y, x] = addressToPoint(address);
      const id = this.getId(y, x);
      diffBefore.set(id, this.get(y, x));
      diffAfter.set(id, value);
      if (partial) {
        this.data.set(id, { ...this.data.get(id), ...value });
      } else {
        this.data.set(id, value);
      }
    });
    if (feedback) {
      this.pushHistory({
        operation: "UPDATE",
        diffBefore,
        diffAfter,
        partial,
        feedback,
      });
    }
  }

  public addRows(
    y: number,
    numRows: number,
    base: number,
    feedback: StoreFeedbackType
  ) {
    const numCols = this.numCols(1);
    const rows: IdMatrix = [];
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.head++;
        row.push(id);
        const cell = this.get(base, j);
        const copied = this.copyCell(cell, base);
        this.data.set(id, copied);
      }
      rows.push(row);
    }
    this.idMatrix.splice(y, 0, ...rows);
    this.area[2] += numRows;
    this.pushHistory({
      operation: "ADD_ROW",
      y,
      numRows,
      idMatrix: rows,
      feedback,
    });
  }
  public removeRows(y: number, numRows: number, feedback: StoreFeedbackType) {
    const rows = this.idMatrix.splice(y, numRows);
    this.area[2] -= numRows;
    this.pushHistory({
      operation: "REMOVE_ROW",
      y,
      numRows,
      idMatrix: rows,
      feedback,
    });
  }
  public addCols(
    x: number,
    numCols: number,
    baseX: number,
    feedback: StoreFeedbackType
  ) {
    const numRows = this.numRows(1);
    const rows: IdMatrix = [];
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.head++;
        row.push(id);
        const cell = this.get(i, baseX);
        const copied = this.copyCell(cell, baseX);
        this.idMatrix[i].splice(x, 0, id);
        this.data.set(id, copied);
      }
      rows.push(row);
    }
    this.area[3] += numCols;
    this.pushHistory({
      operation: "ADD_COL",
      x,
      numCols,
      idMatrix: rows,
      feedback,
    });
  }
  public removeCols(x: number, numCols: number, feedback: StoreFeedbackType) {
    const rows: IdMatrix = [];
    this.idMatrix.map((row) => {
      const deleted = row.splice(x, numCols);
      rows.push(deleted);
    });
    this.area[3] -= numCols;
    this.pushHistory({
      operation: "REMOVE_COL",
      x,
      numCols,
      idMatrix: rows,
      feedback,
    });
  }

  public undo() {
    if (this.historyIndex < 0) {
      return;
    }
    const history = this.histories[this.historyIndex--];
    switch (history.operation) {
      case "UPDATE":
        this.update(history.diffBefore!, history.partial);
        return history.feedback;
      case "ADD_ROW":
        this.idMatrix.splice(history.y, history.numRows);
        this.area[2] -= history.numRows;
        return history.feedback;
      case "ADD_COL":
        this.idMatrix.map((row) => {
          row.splice(history.x, history.numCols);
        });
        this.area[3] -= history.numCols;
        return history.feedback;
      case "REMOVE_ROW":
        this.idMatrix.splice(history.y, 0, ...history.idMatrix);
        this.area[2] += history.numRows;
        return history.feedback;
      case "REMOVE_COL":
        this.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area[3] += history.numCols;
        return history.feedback;
    }
  }

  public redo() {
    if (this.historyIndex + 1 >= this.histories.length) {
      return;
    }
    const history = this.histories[++this.historyIndex];
    switch (history.operation) {
      case "UPDATE":
        this.update(history.diffAfter!, history.partial);
        return history.feedback;
      case "ADD_ROW":
        this.idMatrix.splice(history.y, 0, ...history.idMatrix);
        this.area[2] += history.numRows;
        return history.feedback;
      case "ADD_COL":
        this.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        this.area[3] += history.numCols;
        return history.feedback;
      case "REMOVE_ROW":
        this.idMatrix.splice(history.y, history.numRows);
        this.area[2] -= history.numRows;
        return history.feedback;
      case "REMOVE_COL":
        this.idMatrix.map((row) => {
          row.splice(history.x, history.numCols);
        });
        this.area[3] -= history.numCols;
        return history.feedback;
    }
  }
}
