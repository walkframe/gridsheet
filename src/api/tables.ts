import { defaultParser } from "../parsers/core";
import { defaultRenderer } from "../renderers/core";
import { matrixShape, zoneShape } from "./matrix";
import { AreaType, WriterType } from "../types";
import { AddressTable, CellsType, CellType, Parsers, Renderers } from "../types";
import { createMatrix, writeMatrix } from "./matrix";
import { cellToIndexes, x2c, xy2cell, y2r } from "./converters";

export class UserTable {
  protected addresses: AddressTable;
  protected cells: CellsType;
  protected next: bigint;
  protected area: AreaType;
  protected parsers: Parsers;
  protected renderers: Renderers;

  constructor (
    numRows: number,
    numCols: number,
    cells: CellsType = {},
    parsers: Parsers = {},
    renderers: Renderers = {},
  ) {
    this.addresses = createMatrix(numRows + 1, numCols + 1);
    this.cells = {};
    this.next = BigInt(0);
    this.area = [0, 0, numRows, numCols];
    this.parsers = parsers;
    this.renderers = renderers;

    Object.entries(cells).map(([cellId, cell]) => {
      const [y, x] = cellToIndexes(cellId);
      const address = this.nextAddress();
      this.addresses[y][x] = address;
      this.cells[address] = cell;
    });
    this.addresses.map((row, y) => {
      row.map((address, x) => {
        const common = this.cells[this.addresses[0][0] || ""];
        const row = this.cells[this.addresses[y][0] || ""];
        const col = this.cells[this.addresses[0][x] || ""];
        const cell = this.cells[this.addresses[y][x] || ""];
        const stacked = {
          ...common, ...row, ...col, ...cell,
          style: {...common?.style, ...row?.style, ...col?.style, ...cell?.style},
        };
        if (address == null) {
          address = this.nextAddress();
          this.addresses[y][x] = address;
        }
        if (y > 0 && x > 0) {
          delete stacked.height;
          delete stacked.width;
          delete stacked.label;
        }
        this.cells[address] = stacked;
      })
    });
  }

  protected nextAddress() {
    return (this.next++).toString(36);
  }

  public get(y: number, x: number) {
    if (y === -1 || x === -1) {
      return null;
    }
    const address = this.addresses[y % this.numRows(1)][x % this.numCols(1)];
    return address ? this.cells[address] : null;
  }

  public numRows(base=0) {
    const [top, left, bottom, right] = this.area;
    return base + bottom - top;
  }

  public numCols(base=0) {
    const [top, left, bottom, right] = this.area;
    return base + right - left;
  }

  public matrixFlatten(area?: AreaType, key: keyof CellType = "data") {
    const [top, left, bottom, right] = area || [1, 1, this.area[2], this.area[3]];
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y, x) || {};
        matrix[y - top][x - left] = cell[key] || null;
      }
    }
    return matrix;
  }
  public objectFlatten(key: keyof CellType = "data") {
    const result: CellsType = {};
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left) || {};
        result[xy2cell(x, y)] = cell[key] || null;
      }
    }
    return result;
  }
  public rowsFlatten(key: keyof CellType = "data") {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left) || {};
        row[x2c(x) || y2r(y)] = cell[key] || null;
      }
    }
    return result;
  }
  public colsFlatten(key: keyof CellType = "data") {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.get(y - top, x - left) || {};
        col[y2r(y) || x2c(x)] = cell[key] || null;
      }
    }
    return result;
  }
  public matrix(area?: AreaType) {
    const [top, left, bottom, right] = area || [1, 1, this.area[2], this.area[3]];
    const matrix = createMatrix(bottom - top + 1, right - left + 1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y, x) || {};
        matrix[y - top][x - left] = cell;
      }
    }
    return matrix;
  }
  public object() {
    const result: CellsType = {};
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        result[xy2cell(x, y)] = cell || {};
      }
    }
    return result;
  }
  public rows() {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        row[x2c(x) || y2r(y)] = cell || {};
      }
    }
    return result;
  }
  public cols() {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.get(y - top, x - left);
        col[y2r(y) || x2c(x)] = cell || {};
      }
    }
    return result;
  }
  public top () {
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

  public parse(y: number, x: number, value: string) {
    const cell = this.get(y, x) || {};
    const parser = this.parsers[cell.parser || ""] || defaultParser;
    return parser.parse(value, cell.data);
  }
  public render(y: number, x: number, writer?: WriterType) {
    const cell = this.get(y, x) || {};
    const renderer = this.renderers[cell.renderer || ""] || defaultRenderer;
    return renderer.render(cell.data, writer);
  }
  public stringify(y: number, x: number, data?: any) {
    const cell = this.get(y, x) || {};
    const renderer = this.renderers[cell.renderer || ""] || defaultRenderer;
    return renderer.stringify(typeof data === "undefined" ? cell.data : data);
  }
}

export class Table extends UserTable {
  public copy(
    area?: AreaType,
  ) {
    const copied = new Table(0, 0);
    if (area != null) {
      const [top, left, bottom, right] = area;
      const [numRows, numCols] = zoneShape(area, 1);
      const addresses: AddressTable = createMatrix(numRows, numCols);
      const cells: CellsType = {};
      for (let i = 0; i < numRows; i++) {
        const y = top + i;
        for (let j = 0; j < numCols; j++) {
          const x = left + j;
          const address = this.addresses[y][x];
          if (address != null) {
            addresses[i][j] = address;
            cells[address] = {...this.cells[address]};
          }
        }
      }
      copied.cells = cells;
      copied.addresses = addresses;
      copied.area = area;
      copied.next = this.next;
    } else {
      copied.cells = {...this.cells};
      copied.addresses = [...this.addresses];
      copied.area = [...this.area];
      copied.next = this.next;
    }
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    return copied;
  }
  public shallowCopy() {
    const copied = new Table(0, 0);
    copied.cells = this.cells;
    copied.addresses = this.addresses;
    copied.area = this.area;
    copied.next = this.next;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    return copied;
  }
  public merge(diff: Table) {
    // spread operator is slow
    Object.assign(this.cells, diff.cells);
    this.addresses = writeMatrix(this.addresses, diff.addresses, diff.area);
    this.next = diff.next > this.next ? diff.next : this.next;
    return this.shallowCopy();
  }
  public put(y: number, x: number, cell: CellType) {
    const [numRows, numCols] = [this.numRows(1), this.numCols(1)];
    let address = this.addresses[y % numRows][x % numCols];
    if (address == null) {
      address = this.nextAddress();
      this.addresses[y % numRows][x % numCols] = address;
    }
    this.cells[address] = cell;
  }
  public write(y: number, x: number, value: any, key: keyof CellType = "data") {
    let address = this.addresses[y][x];
    if (address == null) {
      address = this.nextAddress();
      this.addresses[y][x] = address;
      this.cells = {...this.cells, [key]: value};
    } else {
      this.cells = {...this.cells, [address]: {...this.cells[address], [key]: value}};
    }
  }
  public addRows(y: number, numRows: number, baseRow?: Table) {
    const numCols = this.numCols(1);
    this.addresses.splice(y, 0, ...createMatrix(numRows, numCols));
    this.area[2] += numRows;
    if (baseRow != null) {
      const diff = this.diffByFitting([y, 0, y + numRows - 1, numCols - 1], baseRow, ["data"]);
      this.merge(diff);
    }
  }
  public removeRows(y: number, numRows: number) {
    this.addresses.splice(y, numRows);
    this.area[2] -= numRows;
  }
  public addCols(x: number, numCols: number, baseCol?: Table) {
    const addresses = this.addresses.map((row) => {
      const newRows = [...row];
      newRows.splice(x, 0, ...Array(numCols).fill(null));
      return newRows;
    });
    this.addresses = addresses;
    this.area[3] += numCols;
    if (baseCol != null) {
      const diff = this.diffByFitting([0, x, this.numRows(), x + numCols - 1], baseCol, ["data"]);
      this.merge(diff);
    }
  }
  public removeCols(x: number, numCols: number) {
    const addresses = this.addresses.map((row) => {
      const newRows = [...row];
      newRows.splice(x, numCols);
      return newRows;
    });
    this.addresses = addresses;
    this.area[3] -= numCols;
  }

  public diffByMoving(from: AreaType, to: AreaType, cutting=false, ignoringKeys:(keyof CellType)[] = []) {
    const diff = this.copy(to);
    const [maxHeight, maxWidth] = zoneShape(from, 1);

    const [topTo, leftTo, bottomTo, rightTo] = to;
    const [topFrom, leftFrom, bottomFrom, rightFrom] = from;

    if (cutting) {
      for (let y = topFrom; y <= bottomFrom; y++) {
        for (let x = leftFrom; x <= rightFrom; x++) {
          const addressFrom = this.addresses[y][x];
          if (addressFrom != null) {
            diff.cells[addressFrom] = {};
          }
        }
      }
    }
    for (let i = 0; i <= bottomTo - topTo; i++) {
      const y = topTo + i;
      if (y > this.numRows()) {
        continue;
      }
      for (let j = 0; j <= rightTo - leftTo; j++) {
        const x = leftTo + j;
        if (x > this.numCols()) {
          continue;
        }
        const addressFrom = this.addresses[topFrom + (i % maxHeight)][leftFrom + (j % maxWidth)];
        const cell = addressFrom ? {...this.cells[addressFrom]} : {};
        const addressTo = this.addresses[y][x] || diff.nextAddress();
        ignoringKeys.map((key) => delete cell[key]);
        diff.cells[addressTo] = cell;
        diff.addresses[i][j] = addressTo;
      }
    }
    return diff;
  }

  public diffByPasting(to: AreaType, matrix: string[][]) {
    const diff = this.copy(to);
    const [maxHeight, maxWidth] = matrixShape(matrix);
    const [top, left, bottom, right] = to;
    for (let i = 0; i <= bottom - top; i++) {
      if (top + i > this.numRows()) {
        continue;
      }
      for (let j = 0; j <= right - left; j++) {
        if (left + j > this.numCols()) {
          continue;
        }
        const [y, x] = [top + i, left + j];
        const addressTo = this.addresses[y][x] || diff.nextAddress();
        const cell = {...this.cells[addressTo]};
        const parsed = this.parse(y, x, matrix[i % maxHeight][j % maxWidth] || "");
        cell.data = parsed || null;
        diff.cells[addressTo] = cell;
        diff.addresses[i][j] = addressTo;
      }
    }
    return diff;
  }
  public diffByFitting(to: AreaType, rect: Table, ignoringKeys:(keyof CellType)[] = []) {
    const diff = this.copy(to);
    const [top, left, bottom, right] = to;
    for (let i = 0; i <= bottom - top; i++) {
      for (let j = 0; j <= right - left; j++) {
        const [y, x] = [top + i, left + j];
        if (y === 0 && x === 0) {
          continue;
        }
        const cell = {...rect.get(i, j)};
        ignoringKeys.map((key) => delete cell[key]);
        diff.put(y, x, cell);
      }
    }
    return diff;
  }

  public backDiffWithTable(target: Table) {
    const diff = target.copy();
    Object.keys(target.cells).map((address) => {
      diff.cells[address] = this.cells[address];
    });
    return diff;
  }
};
