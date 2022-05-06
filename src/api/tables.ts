import { defaultParser } from "../parsers/core";
import { defaultRenderer } from "../renderers/core";
import { cropMatrix, matrixShape, zoneShape } from "./matrix";
import { AreaType, WriterType } from "../types";
import { CellsType, CellType, Parsers, Renderers, DataType } from "../types";
import { createMatrix, writeMatrix } from "./matrix";
import { cellToIndexes, n2a, x2c, xy2cell, y2r } from "./converters";

export class UserTable {
  protected data: DataType;
  protected area: AreaType;
  protected parsers: Parsers;
  protected renderers: Renderers;

  constructor(
    numRows: number,
    numCols: number,
    cells: CellsType = {},
    parsers: Parsers = {},
    renderers: Renderers = {}
  ) {
    this.data = createMatrix(numRows + 1, numCols + 1);
    this.area = [0, 0, numRows, numCols];
    this.parsers = parsers;
    this.renderers = renderers;

    Object.entries(cells).map(([cellId, cell]) => {
      const [y, x] = cellToIndexes(cellId);
      this.data[y][x] = cell;
    });
    const common = this.data[0][0];
    this.data.map((row, y) => {
      row.map((cell, x) => {
        const row = this.data[y][0];
        const col = this.data[0][x];
        const stacked = {
          ...common,
          ...row,
          ...col,
          ...cell,
          style: {
            ...common?.style,
            ...row?.style,
            ...col?.style,
            ...cell?.style,
          },
        } as CellType;
        if (y > 0 && x > 0) {
          delete stacked.height;
          delete stacked.width;
          delete stacked.label;
        }
        this.data[y][x] = stacked;
      });
    });
  }

  public get(y: number, x: number) {
    if (y === -1 || x === -1) {
      return null;
    }
    return this.data[y % this.numRows(1)][x % this.numCols(1)];
  }
  public firstValue() {
    return this.data?.[0]?.[0]?.value;
  }

  public numRows(base = 0) {
    const [top, left, bottom, right] = this.area;
    return base + bottom - top;
  }

  public numCols(base = 0) {
    const [top, left, bottom, right] = this.area;
    return base + right - left;
  }

  public matrixFlatten(area?: AreaType, key: keyof CellType = "value") {
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
        matrix[y - top][x - left] = cell[key] || null;
      }
    }
    return matrix;
  }
  public objectFlatten(key: keyof CellType = "value") {
    const result: CellsType = {};
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          result[xy2cell(x, y)] = cell[key] || null;
        }
      }
    }
    return result;
  }
  public rowsFlatten(key: keyof CellType = "value") {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let y = top; y <= bottom; y++) {
      const row: CellsType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          row[x2c(x) || y2r(y)] = cell[key] || null;
        }
      }
    }
    return result;
  }
  public colsFlatten(key: keyof CellType = "value") {
    const result: CellsType[] = [];
    const [top, left, bottom, right] = this.area;
    for (let x = left; x <= right; x++) {
      const col: CellsType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.get(y - top, x - left);
        if (cell != null) {
          col[y2r(y) || x2c(x)] = cell[key] || null;
        }
      }
    }
    return result;
  }
  public matrix(area?: AreaType) {
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
        if (cell != null) {
          result[xy2cell(x, y)] = cell;
        }
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
        if (cell != null) {
          row[x2c(x) || y2r(y)] = cell;
        }
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
        if (cell != null) {
          col[y2r(y) || x2c(x)] = cell || {};
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
    const copied = new Table(0, 0);
    if (area != null) {
      const [top, left, bottom, right] = area;
      const [numRows, numCols] = zoneShape(area, 1);
      const data: DataType = createMatrix(numRows, numCols);
      for (let i = 0; i < numRows; i++) {
        const y = top + i;
        for (let j = 0; j < numCols; j++) {
          const x = left + j;
          data[i][j] = this.data[y][x];
        }
      }
      copied.data = data;
      copied.area = area;
    } else {
      copied.data = this.data.map((row) => row.map((col) => col));
      copied.area = [...this.area];
    }
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    return copied;
  }
}

export class Table extends UserTable {
  public shallowCopy() {
    const copied = new Table(0, 0);
    copied.data = this.data;
    copied.area = this.area;
    copied.parsers = this.parsers;
    copied.renderers = this.renderers;
    return copied;
  }
  public merge(diffs: Table[]) {
    diffs.map((diff) => {
      this.data = writeMatrix(this.data, diff.data, diff.area);
    });
    return this.shallowCopy();
  }
  public joinDiffs(diffs: Table[]) {
    const table = new Table(0, 0);
    table.data = createMatrix(this.numRows(1), this.numCols(1));
    table.area = [...this.area];
    table.merge(diffs);
    let [bottom, right, top, left] = table.area;
    diffs.map((diff) => {
      const [_top, _left, _bottom, _right] = diff.area;
      if (top > _top) {
        top = _top;
      }
      if (left > _left) {
        left = _left;
      }
      if (bottom < _bottom) {
        bottom = _bottom;
      }
      if (right < _right) {
        right = _right;
      }
    });
    table.area = [top, left, bottom, right];
    table.data = cropMatrix(table.data, table.area);
    return table;
  }
  public put(y: number, x: number, cell: CellType) {
    const [numRows, numCols] = [this.numRows(1), this.numCols(1)];
    this.data[y % numRows][x % numCols] = cell;
  }
  public write(y: number, x: number, value: any) {
    const cell = this.parse(y, x, value);
    this.put(y, x, cell);
  }
  public addRows(y: number, numRows: number, baseRow?: Table) {
    const numCols = this.numCols(1);
    this.data.splice(y, 0, ...createMatrix(numRows, numCols));
    this.area[2] += numRows;
    if (baseRow != null) {
      const diff = this.diffByFitting(
        [y, 0, y + numRows - 1, numCols - 1],
        baseRow,
        ["value"]
      );
      this.merge(diff);
    }
  }
  public removeRows(y: number, numRows: number) {
    this.data.splice(y, numRows);
    this.area[2] -= numRows;
  }
  public addCols(x: number, numCols: number, baseCol?: Table) {
    const data = this.data.map((row) => {
      const newRows = [...row];
      newRows.splice(x, 0, ...Array(numCols).fill(null));
      return newRows;
    });
    this.data = data;
    this.area[3] += numCols;
    if (baseCol != null) {
      const diff = this.diffByFitting(
        [0, x, this.numRows(), x + numCols - 1],
        baseCol,
        ["value"]
      );
      this.merge(diff);
    }
  }
  public removeCols(x: number, numCols: number) {
    const data = this.data.map((row) => {
      const newRows = [...row];
      newRows.splice(x, numCols);
      return newRows;
    });
    this.data = data;
    this.area[3] -= numCols;
  }

  public diffByMoving(
    from: AreaType,
    to: AreaType,
    cutting = false,
    ignoringKeys: (keyof CellType)[] = []
  ) {
    const [maxHeight, maxWidth] = zoneShape(from, 1);

    const [topTo, leftTo, bottomTo, rightTo] = to;
    const [topFrom, leftFrom, bottomFrom, rightFrom] = from;
    const diffs: Table[] = [];

    if (cutting) {
      const diff = new Table(
        bottomFrom - topFrom + 1,
        rightFrom - leftFrom + 1
      );
      diff.area = from;
      diffs.push(diff);
    }
    const diff = this.copy(to);
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
        const cell = {
          ...this.data[topFrom + (i % maxHeight)][leftFrom + (j % maxWidth)],
        };
        diff.data[i][j] = cell;
        ignoringKeys.map((key) => delete cell[key]);
      }
    }
    diffs.push(diff);
    return diffs;
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
        const cell = this.data[y][x];
        const parsed = this.parse(
          y,
          x,
          matrix[i % maxHeight][j % maxWidth] || ""
        );
        diff.data[i][j] = { ...cell, ...parsed };
      }
    }
    return [diff];
  }
  public diffByFitting(
    to: AreaType,
    rect: Table,
    ignoringKeys: (keyof CellType)[] = []
  ) {
    const diff = this.copy(to);
    const [top, left, bottom, right] = to;
    for (let i = 0; i <= bottom - top; i++) {
      for (let j = 0; j <= right - left; j++) {
        const [y, x] = [top + i, left + j];
        if (y === 0 && x === 0) {
          continue;
        }
        const cell = { ...rect.get(i, j) };
        ignoringKeys.map((key) => delete cell[key]);
        diff.put(y, x, cell);
      }
    }
    return [diff];
  }

  public backDiffWithTable(targets: Table[]) {
    const diffs: Table[] = [];
    [...targets].reverse().map((target) => {
      const diff = target.copy();
      const [top, left, bottom, right] = diff.area;
      for (let i = 0; i <= bottom - top; i++) {
        for (let j = 0; j <= right - left; j++) {
          const [y, x] = [top + i, left + j];
          diff.put(i, j, { ...this.data[y][x] });
        }
      }
      diffs.push(diff);
    });

    return diffs;
  }
  public diffWithCells(cells: CellsType) {
    let [bottom, right, top, left] = this.area;
    Object.entries(cells).map(([cellId, cell]) => {
      const [y, x] = cellToIndexes(cellId);
      if (top > y) {
        top = y;
      }
      if (left > x) {
        left = x;
      }
      if (bottom < y) {
        bottom = y;
      }
      if (right < x) {
        right = x;
      }
    });

    const [numRows, numCols] = [bottom - top, right - left];
    const diff = new Table(numRows, numCols);
    diff.area = [top, left, bottom, right];

    Object.entries(cells).map(([cellId, b]) => {
      const [y, x] = cellToIndexes(cellId);
      const a = this.get(y, x);
      const cell = { ...a, ...b, style: { ...a?.style, ...b?.style } };
      diff.put(y - top, x - left, cell);
    });
    return diff;
  }
}
