import { defaultParser } from "../parsers/core";
import { defaultRenderer } from "../renderers/core";
import { cropMatrix, matrixShape, zoneShape } from "./matrix";
import {
  Address,
  AddressRow,
  AddressTable,
  AreaType,
  CellsMapType,
  PositionType,
  WriterType,
} from "../types";
import { CellsType, CellType, Parsers, Renderers, DataType } from "../types";
import { createMatrix, writeMatrix } from "./matrix";
import { cellToIndexes, n2a, x2c, xy2cell, y2r } from "./converters";
import { FunctionMapping } from "../formula/functions/__base";
import { functions } from "../formula/mapping";
import { solveFormula } from "../formula/evaluator";

type Props = {
  numRows: number;
  numCols: number;
  cells?: CellsType;
  parsers?: Parsers;
  renderers?: Renderers;
  useBigInt?: boolean;
  historySize?: number;
};

type HistoryType =
  | "WRITE"
  | "COPY"
  | "CUT"
  | "ADD_ROW"
  | "ADD_COL"
  | "REMOVE_ROW"
  | "REMOVE_COL";

export class History {
  public operation: HistoryType;
  public diffBefore?: CellsMapType;
  public diffAfter?: CellsMapType;
  public addressTable?: AddressTable;
  public position?: PositionType;

  constructor(operation: HistoryType) {
    this.operation = operation;
  }
}

export class UserTable {
  protected head: Address;
  protected addressTable: AddressTable;
  protected cells: CellsMapType;
  protected area: AreaType;
  protected parsers: Parsers;
  protected renderers: Renderers;
  public functions: FunctionMapping = {};
  protected base: UserTable;
  protected histories: History[];
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
    this.cells = new Map();
    this.area = [0, 0, numRows, numCols];
    this.parsers = parsers;
    this.renderers = renderers;
    this.base = this;
    this.addressTable = [];
    this.histories = [];
    this.historySize = historySize;

    const common = cells.default;
    for (let y = 0; y < numRows + 1; y++) {
      const addresses: AddressRow = [];
      const rowId = y2r(y);
      const rowDefault = cells[rowId];
      this.addressTable.push(addresses);
      for (let x = 0; x < numRows + 1; x++) {
        const address = this.head++;
        addresses.push(address);
        const cellId = xy2cell(x, y);
        const colId = x2c(x);
        const colDefault = cells[colId];
        const cell = cells[cellId];
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
        this.cells.set(address, stacked);
      }
    }
  }

  public getAddress(y: number, x: number) {
    return this.addressTable[y][x];
  }

  public get(y: number, x: number) {
    if (y === -1 || x === -1) {
      return undefined;
    }
    const address = this.addressTable[y % this.numRows(1)][x % this.numCols(1)];
    return this.cells.get(address);
  }

  public getByAddress(address: Address) {
    return this.cells.get(address);
  }

  public getById(id: string) {
    const [y, x] = cellToIndexes(id);
    return this.get(y, x);
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
  public getWholeArea(): AreaType {
    if (this.isBase()) {
      return [...this.area];
    }
    return [0, 0, this.numRows(), this.numCols()];
  }
  public isBase() {
    return this.top() === 0 && this.left() === 0;
  }

  public parse(y: number, x: number, value: string) {
    const cell = this.get(y, x) || {};
    const parser = this.parsers[cell.parser || ""] || defaultParser;
    return parser.parse(value, cell);
  }
  public render(y: number, x: number, writer?: WriterType) {
    const cell = this.get(y, x) || {};
    const renderer = this.renderers[cell.renderer || ""] || defaultRenderer;
    return renderer.render(this, y, x, writer);
  }
  public stringify(y: number, x: number, value?: any) {
    const cell = this.get(y, x);
    const renderer = this.renderers[cell?.renderer || ""] || defaultRenderer;
    if (typeof value === "undefined") {
      return renderer.stringify(cell || {});
    }
    return renderer.stringify({ ...cell, value });
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
    copied.addressTable = this.addressTable;
    copied.cells = this.cells;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    copied.functions = this.functions;
    copied.histories = this.histories;
    copied.historySize = this.historySize;
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
    copied.addressTable = this.addressTable;
    copied.cells = this.cells;
    copied.area = this.area;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    copied.functions = this.functions;
    copied.histories = this.histories;
    copied.historySize = this.historySize;
    copied.base = this;
    return copied;
  }

  public pushHistory(history: History) {
    this.histories.push(history);
  }

  public update(operation: HistoryType, diff: CellsMapType) {
    const before: CellsMapType = new Map();
    const after: CellsMapType = new Map();
    diff.forEach((cell, address) => {
      const current = this.getByAddress(address);
      before.set(address, current);
      const changed = { ...current, ...cell };
      this.cells.set(address, changed);
      after.set(address, changed);
    });
    this.createHistoryByDiff(operation, before, after);
  }

  public createHistoryByDiff(
    operation: HistoryType,
    before: CellsMapType,
    after: CellsMapType
  ) {
    const history = new History(operation);
    history.diffBefore = before;
    history.diffAfter = after;
    this.pushHistory(history);
  }

  public getDiffByPos(y: number, x: number, cell: CellType) {
    const diff: CellsMapType = new Map();
    const address = this.getAddress(y, x);
    diff.set(address, cell);
    return diff;
  }

  public createBackDiff(area: AreaType) {
    const backdiff: CellsMapType = new Map();
    const [top, left, bottom, right] = area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const address = this.getAddress(y, x);
        backdiff.set(address, this.get(y, x));
      }
    }
    return backdiff;
  }

  public put(y: number, x: number, cell: CellType) {
    const [numRows, numCols] = [this.numRows(1), this.numCols(1)];
    const modY = y % numRows;
    const modX = x % numCols;
    const address = this.getAddress(modY, modX);
    this.cells.set(address, cell);
  }

  public write(y: number, x: number, value: any) {
    const before = this.createBackDiff([y, x, y, x]);
    const cell = this.parse(y, x, value);
    const after = this.getDiffByPos(y, x, cell);
    this.createHistoryByDiff("WRITE", before, after);
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
  public addRows(y: number, numRows: number, base: number) {
    const numCols = this.numCols(1);
    const rows: AddressTable = [];
    for (let i = 0; i < numRows; i++) {
      const row: AddressRow = [];
      for (let j = 0; j < numCols; j++) {
        const address = this.head++;
        row.push(address);
        const cell = this.get(base, j);
        const copied = this.copyCell(cell, base);
        this.cells.set(address, copied);
      }
      rows.push(row);
    }
    this.addressTable.splice(y, 0, ...rows);
    this.area[2] += numRows;
  }
  public removeRows(y: number, numRows: number) {
    this.addressTable.splice(y, numRows);
    this.area[2] -= numRows;
  }
  public addCols(x: number, numCols: number, base: number) {
    const numRows = this.numRows(1);
    const rows: AddressTable = [];
    for (let i = 0; i < numRows; i++) {
      const row: AddressRow = [];
      for (let j = 0; j < numCols; j++) {
        const address = this.head++;
        row.push(address);
        const cell = this.get(i, base);
        const copied = this.copyCell(cell, base);
        this.cells.set(address, copied);
      }
      rows.push(row);
    }
    this.addressTable.splice(0, x, ...rows);
    this.area[3] += numCols;
  }
  public removeCols(x: number, numCols: number) {
    this.addressTable.map((row) => {
      row.splice(x, numCols);
    });
    this.area[3] -= numCols;
  }
}
