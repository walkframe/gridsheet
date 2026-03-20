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
  FilterConfig,
  HistoryType,
  HistorySortRowsType,
  StorePatchType,
  ShapeType,
  RectType,
  OperatorType,
  OperationType,
  RawCellType,
  ExtraPointType,
  StoreType,
  RefEvaluation,
  MoveRelations,
  Y,
  X,
  System,
} from '../types';
import {
  among,
  areaShape,
  createMatrix,
  expandRange,
  getMaxSizesFromCells,
  invertObject,
  matrixShape,
} from './spatial';
import { a2p, x2c, c2x, p2a, y2r, grantAddressAbsolute } from './coords';
import type { FunctionMapping } from '../formula/functions/__base';
import { identifyFormula, Lexer, splitRef, stripSheetName } from '../formula/evaluator';
import { FormulaError } from '../formula/formula-error';
import { solveFormula, solveSheet, stripSheet } from '../formula/solver';
import { ensureSys, filterCellFields } from './cell';

import { DEFAULT_HEIGHT, DEFAULT_WIDTH, HEADER_HEIGHT, HEADER_WIDTH, DEFAULT_HISTORY_LIMIT } from '../constants';
import { Pending, SOLVING, Spilling } from '../sentinels';
import { shouldTracking } from '../store/helpers';
import { updateSheet } from '../store/actions';
import * as operation from './operation';
import { Binding, createBinding } from './hub';
import { nonePolicy, PolicyType, DEFAULT_POLICY_NAME, RenderProps, ScalarProps } from '../policy/core';
import { evaluateFilterConfig } from './filter';
import { ReferencePreserver } from './reference';

type Props = {
  minNumRows?: number;
  maxNumRows?: number;
  minNumCols?: number;
  maxNumCols?: number;
  functions?: FunctionMapping;
  sheetName?: string;
  book?: Binding;
};

const noFilter: CellFilter = () => true;

type GetProps = {
  // do not use 'SYSTEM', it is reserved for internal use.
  refEvaluation?: RefEvaluation;
  raise?: boolean;
  filter?: CellFilter;
  asScalar?: boolean;
};

type MoveProps = {
  srcSheet?: UserSheet;
  src: AreaType;
  dst: AreaType;
  operator?: OperatorType;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  historicize?: boolean;
};

type CellField = keyof CellType;

type GetCellProps = GetProps & {
  ignoreFields?: CellField[];
};

type ToCellMatrixProps = GetCellProps & {
  area?: AreaType;
};

type GetPropsWithArea = GetProps & {
  area?: AreaType;
};

type ToValueMatrixProps = GetProps & {
  area?: AreaType;
};

type ToCellObjectProps = GetCellProps & {
  addresses?: Address[];
};

type GetPropsWithAddresses = GetProps & {
  addresses?: Address[];
};

type ToValueObjectProps = GetProps & {
  addresses?: Address[];
};

type ToCellRowsProps = GetCellProps & {
  rows?: number[];
};

type GetPropsWithRows = GetProps & {
  rows?: number[];
};

type ToValueRowsProps = GetProps & {
  rows?: number[];
};

type ToCellColsProps = GetCellProps & {
  cols?: (number | string)[];
};

type GetPropsWithCols = GetProps & {
  cols?: (number | string)[];
};

type ToValueColsProps = GetProps & {
  cols?: (number | string)[];
};

export interface UserSheet {
  changedTime: number;
  lastChangedTime?: number;
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
   * Returns the raw sheet object, which is used for internal operations.
   * This is not intended for public use and may change in future versions.
   */
  __raw__: Sheet;

  getRectSize(area: AreaType): RectType;
  getCellByPoint(point: PointType, refEvaluation?: RefEvaluation, raise?: boolean): CellType | undefined;
  getCellByAddress(address: Address, refEvaluation?: RefEvaluation, raise?: boolean): CellType | undefined;
  getPolicyByPoint(point: PointType): PolicyType;
  getNumRows(base?: number): number;
  getNumCols(base?: number): number;
  toValueMatrix(args?: ToValueMatrixProps): any[][];
  toValueObject(args?: ToValueObjectProps): { [address: Address]: any };
  toValueRows(args?: ToValueRowsProps): { [address: Address]: any }[];
  toValueCols(args?: ToValueColsProps): { [address: Address]: any }[];
  toCellMatrix(args?: ToCellMatrixProps): (CellType | null)[][];
  toCellObject(args?: ToCellObjectProps): CellsByAddressType;
  toCellRows(args?: ToCellRowsProps): CellsByAddressType[];
  toCellCols(args?: ToCellColsProps): CellsByAddressType[];
  getHistories(): HistoryType[];
  move(args: MoveProps): UserSheet;
  copy(args: MoveProps & { onlyValue?: boolean }): UserSheet;
  update(args: {
    diff: CellsByAddressType;
    historicize?: boolean;
    partial?: boolean;
    updateChangedTime?: boolean;
    reflection?: StorePatchType;
  }): UserSheet;
  writeMatrix(args: {
    point: PointType;
    matrix: MatrixType<string>;
    updateChangedTime?: boolean;
    reflection?: StorePatchType;
  }): UserSheet;
  write(args: { point: PointType; value: string; updateChangedTime?: boolean; reflection?: StorePatchType }): UserSheet;
  insertRows(args: {
    y: number;
    numRows: number;
    baseY: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedTime?: boolean;
    reflection?: StorePatchType;
  }): UserSheet;
  removeRows(args: { y: number; numRows: number; reflection?: StorePatchType }): UserSheet;
  insertCols(args: {
    x: number;
    numCols: number;
    baseX: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedTime?: boolean;
    reflection?: StorePatchType;
  }): UserSheet;
  removeCols(args: { x: number; numCols: number; reflection?: StorePatchType }): UserSheet;
  undo(): {
    history: HistoryType | null;
  };
  redo(): {
    history: HistoryType | null;
  };
  getHistories(): HistoryType[];
  getHistoryIndex(): number;
  getHistorySize(): number;
  setHeaderHeight(height: number, historicize?: boolean): UserSheet;
  setHeaderWidth(width: number, historicize?: boolean): UserSheet;

  sortRows(args: { x: number; direction: 'asc' | 'desc' }): UserSheet;

  filterRows(args?: { x?: number; filter?: FilterConfig }): UserSheet;
  isRowFiltered(y: number): boolean;
  hasActiveFilters(): boolean;
  hasPendingCells(): boolean;
  waitForPending(): Promise<void>;
  getLastChangedAddresses(): Address[];

  stringify(props: { point: PointType; cell?: CellType; refEvaluation?: RefEvaluation }): string;

  get shape(): { rows: number; cols: number };
}

export class Sheet implements UserSheet {
  public __isSheet = true;
  public changedTime: number;
  public lastChangedTime?: number;
  public minNumRows: number;
  public maxNumRows: number;
  public minNumCols: number;
  public maxNumCols: number;
  public sheetId: number = 0;
  public sheetName: string = '';
  public prevSheetName: string = '';
  public status: 0 | 1 | 2 = 0; // 0: not initialized, 1: initialized, 2: formula absoluted
  public binding: Binding;
  public idsToBeIdentified: Id[] = [];
  public totalWidth = 0;
  public totalHeight = 0;
  public fullHeight = 0;

  private version = 0;
  private idMatrix: IdMatrix;
  private area: AreaType = { top: 0, left: 0, bottom: 0, right: 0 };
  private addressCaches: Map<Id, Address> = new Map();
  private lastChangedAddresses: Address[] = [];

  constructor({
    minNumRows = 1,
    maxNumRows = -1,
    minNumCols = 1,
    maxNumCols = -1,
    sheetName,
    book = createBinding({}),
  }: Props) {
    this.idMatrix = [];
    this.changedTime = Date.now();
    this.minNumRows = minNumRows || 0;
    this.maxNumRows = maxNumRows || 0;
    this.minNumCols = minNumCols || 0;
    this.maxNumCols = maxNumCols || 0;
    this.sheetName = sheetName || '';
    this.prevSheetName = this.sheetName;
    this.binding = book;
  }

  static is(obj: any): obj is Sheet {
    return obj?.__isSheet === true;
  }

  toString() {
    return `Sheet(name=${escapeSheetName(this.sheetName)}, size=${this.getNumRows()}x${this.getNumCols()})`;
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

  /** Get the raw (mutable) cell data for a point. Unlike getCellByPoint, this returns the actual binding.data reference. */
  private _getRawCellByPoint({ y, x }: PointType): CellType | undefined {
    const id = this.idMatrix[y]?.[x];
    if (id == null) {
      return undefined;
    }
    return this.binding.data[id];
  }

  public isRowFiltered(y: number): boolean {
    return !!this._getRawCellByPoint({ y, x: 0 })?.filtered;
  }

  public hasActiveFilters(): boolean {
    const numCols = this.getNumCols();
    for (let col = 1; col <= numCols; col++) {
      const colCell = this._getRawCellByPoint({ y: 0, x: col });
      if (colCell?.filter && colCell.filter.conditions.length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if any data cell in this sheet currently holds a Pending value
   * (i.e. an async formula that hasn't resolved yet).
   */
  public hasPendingCells(): boolean {
    const numRows = this.getNumRows();
    const numCols = this.getNumCols();
    for (let y = 1; y <= numRows; y++) {
      for (let x = 1; x <= numCols; x++) {
        const cell = this.getCellByPoint({ y, x }, 'COMPLETE');
        if (Pending.is(cell?.value)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Returns a Promise that resolves when all in-flight async formula computations
   * have completed and no data cells hold Pending values.
   * If nothing is pending, resolves immediately.
   * Useful for waiting before sort/filter so that cell values are fully resolved.
   */
  public waitForPending(): Promise<void> {
    const pendingMap = this.binding.asyncPending;
    // If there are in-flight promises, wait for them first
    if (pendingMap.size > 0) {
      const promises = Array.from(pendingMap.values()).map((p) => p.promise);
      return Promise.all(promises).then(() => this.waitForPending());
    }
    // Even if asyncPending is empty, cells may still hold Pending values
    // (e.g. propagated pending from dependent formulas).
    // In that case, wait for the next transmit cycle and re-check.
    if (this.hasPendingCells()) {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (this.binding.asyncPending.size > 0) {
            const promises = Array.from(this.binding.asyncPending.values()).map((p) => p.promise);
            Promise.all(promises).then(check);
          } else if (this.hasPendingCells()) {
            // Still pending — wait a tick for transmit/re-render
            setTimeout(check, 50);
          } else {
            resolve();
          }
        };
        check();
      });
    }
    return Promise.resolve();
  }

  /**
   * Returns the addresses that were changed in the most recent `_update()` call.
   * Useful inside `onChange` to know which cells were modified.
   */
  public getLastChangedAddresses(): Address[] {
    return this.lastChangedAddresses;
  }

  /** Capture the current state of all filter-related cells (column headers + row headers) as a CellsByIdType snapshot */
  /** Capture the full cell state of all filter-related header cells as a CellsByIdType snapshot */
  private _captureFilterCellStates(): CellsByIdType {
    const snapshot: CellsByIdType = {};
    const numCols = this.getNumCols();
    const numRows = this.getNumRows();
    // Column header cells (filter config)
    for (let col = 1; col <= numCols; col++) {
      const id = this.idMatrix[0]?.[col];
      if (id != null) {
        snapshot[id] = { ...this.binding.data[id] };
      }
    }
    // Row header cells (filtered flag)
    for (let y = 1; y <= numRows; y++) {
      const id = this.idMatrix[y]?.[0];
      if (id != null) {
        snapshot[id] = { ...this.binding.data[id] };
      }
    }
    return snapshot;
  }

  public filterRows({
    x,
    filter,
  }: {
    x?: number;
    filter?: FilterConfig;
  } = {}) {
    const diffBefore = this._captureFilterCellStates();

    if (x == null) {
      const numCols = this.getNumCols();
      for (let col = 1; col <= numCols; col++) {
        const colCell = this._getRawCellByPoint({ y: 0, x: col });
        delete colCell?.filter;
      }
    } else {
      const colCell = this._getRawCellByPoint({ y: 0, x });
      if (colCell) {
        if (filter) {
          colCell.filter = filter;
        } else {
          delete colCell.filter;
        }
      }
    }
    this._reapplyFilters();

    const diffAfter = this._captureFilterCellStates();

    const changed = Object.keys(diffBefore).some(
      (id) => JSON.stringify(diffBefore[id]) !== JSON.stringify(diffAfter[id]),
    );

    if (changed) {
      this.pushHistory({
        applyed: true,
        operation: 'UPDATE',
        srcSheetId: this.sheetId,
        dstSheetId: this.sheetId,
        diffBefore,
        diffAfter,
        partial: false,
      });
    }

    return this.refresh(false, true);
  }

  private _reapplyFilters() {
    // Collect active filters from column header cells
    const numCols = this.getNumCols();
    const activeFilters: { x: number; filter: FilterConfig }[] = [];
    const changedAddresses: Address[] = [];
    for (let col = 1; col <= numCols; col++) {
      const colCell = this._getRawCellByPoint({ y: 0, x: col });
      if (colCell?.filter && colCell.filter.conditions.length > 0) {
        activeFilters.push({ x: col, filter: colCell.filter });
      }
      // Track column header cells that have filter config changes
      changedAddresses.push(p2a({ y: 0, x: col }));
    }

    const numRows = this.getNumRows();

    // Evaluate each row and update filtered flag
    for (let y = 1; y <= numRows; y++) {
      const rowCell = this._getRawCellByPoint({ y, x: 0 });
      if (!rowCell) {
        continue;
      }

      let shouldFilter = false;
      for (const { x: col, filter } of activeFilters) {
        const cell = this.getCellByPoint({ y, x: col }, 'COMPLETE');
        if (!evaluateFilterConfig(filter, cell?.value)) {
          shouldFilter = true;
          break;
        }
      }

      const wasFiltered = !!rowCell.filtered;
      if (shouldFilter) {
        rowCell.filtered = true;
      } else {
        delete rowCell.filtered;
      }
      if (wasFiltered !== shouldFilter) {
        changedAddresses.push(p2a({ y, x: 0 }));
      }
    }

    this.lastChangedAddresses = changedAddresses;
  }

  public sortRows({ x, direction }: { x: number; direction: 'asc' | 'desc' }) {
    const numRows = this.getNumRows();
    if (numRows <= 1) {
      return this;
    }

    // Collect row indices (data rows: 1..numRows)
    const rowIndices: number[] = [];
    for (let y = 1; y <= numRows; y++) {
      rowIndices.push(y);
    }

    // Sort by resolved cell value at column x
    rowIndices.sort((a, b) => {
      const cellA = this.getCellByPoint({ y: a, x }, 'COMPLETE');
      const cellB = this.getCellByPoint({ y: b, x }, 'COMPLETE');
      const valA = cellA?.value;
      const valB = cellB?.value;

      // null/undefined goes to the end
      if (valA == null && valB == null) {
        return 0;
      }
      if (valA == null) {
        return 1;
      }
      if (valB == null) {
        return -1;
      }

      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else if (valA instanceof Date && valB instanceof Date) {
        cmp = valA.getTime() - valB.getTime();
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }
      return direction === 'asc' ? cmp : -cmp;
    });

    // Check if order actually changed
    let changed = false;
    for (let i = 0; i < rowIndices.length; i++) {
      if (rowIndices[i] !== i + 1) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      return this;
    }

    // Build row mapping: original position -> new position
    const sortedRowMapping: { [beforeY: number]: number } = {};
    for (let newY = 0; newY < rowIndices.length; newY++) {
      const oldY = rowIndices[newY];
      sortedRowMapping[oldY] = newY + 1;
    }

    // Apply the sort by rearranging idMatrix rows
    const savedRows: Ids[] = [];
    for (let i = 0; i < rowIndices.length; i++) {
      savedRows.push(this.idMatrix[rowIndices[i]]);
    }
    for (let i = 0; i < rowIndices.length; i++) {
      this.idMatrix[i + 1] = savedRows[i];
    }
    this.addressCaches.clear();

    this.pushHistory({
      applyed: true,
      operation: 'SORT_ROWS',
      srcSheetId: this.sheetId,
      dstSheetId: this.sheetId,
      sortedRowMapping,
    } as HistorySortRowsType);

    return this.refresh(true, true);
  }

  private _sortRowMapping(sortedRowMapping: { [beforeY: number]: number }, inverse = false) {
    // Convert mapping to array and apply the sort order
    const numRows = this.getNumRows();
    const newOrder: number[] = new Array(numRows);

    if (inverse) {
      // Undo: reverse the mapping
      // If sortedRowMapping says "oldY -> newY", then to undo we put "newY -> oldY"
      for (const [oldYStr, newY] of Object.entries(sortedRowMapping)) {
        const oldY = Number(oldYStr);
        newOrder[oldY - 1] = newY;
      }
    } else {
      // Redo: apply the mapping
      // sortedRowMapping[oldY] = newY means row oldY goes to position newY
      for (const [oldYStr, newY] of Object.entries(sortedRowMapping)) {
        const oldY = Number(oldYStr);
        newOrder[newY - 1] = oldY;
      }
    }

    // Apply the sort order: newOrder[i] = original row index that should end up at position i+1
    const savedRows: Ids[] = [];
    for (let i = 0; i < newOrder.length; i++) {
      savedRows.push(this.idMatrix[newOrder[i]]);
    }
    for (let i = 0; i < newOrder.length; i++) {
      this.idMatrix[i + 1] = savedRows[i];
    }
    this.addressCaches.clear();
  }

  get isInitialized() {
    return this.status === 2;
  }

  get functions() {
    return this.binding.functions;
  }

  get policies() {
    return this.binding.policies;
  }

  public identifyFormula() {
    this.idsToBeIdentified.forEach((id) => {
      const cell = this.binding.data[id];
      if (cell?._sys?.sheetId == null) {
        return;
      }
      cell.value = identifyFormula(cell?.value, {
        sheet: this,
        dependency: id,
      });
    });
    this.idsToBeIdentified = [];
    this.status = 2;
  }

  public getSheetId() {
    return this.sheetId;
  }

  public getSheetBySheetName(sheetName: string) {
    const sheetId = this.binding.sheetIdsByName[sheetName];
    return this.getSheetBySheetId(sheetId);
  }
  public getSheetBySheetId(sheetId: number) {
    return this.binding.contextsBySheetId[sheetId]?.store?.sheetReactive?.current;
  }

  private static _stack(...cells: CellType[]) {
    const extension: CellType = {};
    cells.forEach((cell) => {
      if (cell?.style) {
        extension.style = { ...extension.style, ...cell.style };
      }
      if (cell?.prevention) {
        extension.prevention = (extension.prevention || 0) | cell.prevention;
      }
    });
    return extension;
  }

  public initialize(cells: CellsByAddressType) {
    if (this.status > 1) {
      return;
    }
    if (cells[0] == null) {
      cells[0] = { width: HEADER_WIDTH, height: HEADER_HEIGHT };
    }
    const auto = getMaxSizesFromCells(cells);
    const changedTime = Date.now();
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
      if (address === 'default') {
        return;
      }
      const range = expandRange(address);
      const data = cells[address];

      range.forEach((address) => {
        const origin = cells[address];
        cells[address] = {
          ...origin,
          ...data,
          ...Sheet._stack(origin, data),
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
        let stacked = {
          ...common,
          ...rowDefault,
          ...colDefault,
          ...cell,
          ...Sheet._stack(common, rowDefault, colDefault, cell),
        } as CellType;

        if (stacked?.value?.startsWith?.('=') && (stacked?.formulaEnabled ?? true)) {
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
          delete stacked.label;
        }

        const policy = this.policies[stacked.policy ?? ''] ?? this.defaultPolicy;
        stacked = policy.deserializeValue(stacked.value, stacked) ?? {};
        stacked._sys = { id, changedTime, sheetId: this.sheetId };
        this.binding.data[id] = stacked;
      }
    }
    this.status = 1; // initialized
    this.binding.sheetIdsByName[this.sheetName] = this.sheetId;
  }

  public incrementVersion() {
    this.version++;
    if (this.version >= Number.MAX_SAFE_INTEGER) {
      this.version = 1;
    }
  }

  public xsheetDispatch(otherSheet: Sheet) {
    if (otherSheet === this) {
      return;
    }
    otherSheet.refresh(true);
    const context = this.binding.contextsBySheetId[otherSheet.sheetId];
    if (context !== null) {
      const { dispatch } = context;
      requestAnimationFrame(() => {
        dispatch(updateSheet(otherSheet));
      });
    }
  }

  private generateId() {
    return (this.binding.cellHead++).toString();
  }

  public getRectSize({ top, left, bottom, right }: AreaType): RectType {
    // Use System.offsetLeft / System.offsetTop stored on header cells for O(1) lookup.
    // offsetLeft on (y=0, x) = absolute left of column x
    // offsetTop on (y, x=0) = absolute top of row y
    const l = left || 1;
    const t = top || 1;

    const colRightCell = this.getCellByPoint({ y: 0, x: right }, 'SYSTEM');
    const colLeftCell = this.getCellByPoint({ y: 0, x: l }, 'SYSTEM');
    const rowBottomCell = this.getCellByPoint({ y: bottom, x: 0 }, 'SYSTEM');
    const rowTopCell = this.getCellByPoint({ y: t, x: 0 }, 'SYSTEM');

    const rw = colRightCell?._sys?.offsetLeft ?? 0;
    const lw = colLeftCell?._sys?.offsetLeft ?? 0;
    const rh = rowBottomCell?._sys?.offsetTop ?? 0;
    const th = rowTopCell?._sys?.offsetTop ?? 0;

    const width = Math.max(0, rw - lw);
    const height = Math.max(0, rh - th);
    return { y: t, x: l, height, width };
  }

  public setTotalSize() {
    const numCols = this.getNumCols();
    const numRows = this.getNumRows();
    const headerW = this.headerWidth;
    const headerH = this.headerHeight;

    // Write offsetLeft into column-header cells (y=0, x=1..numCols)
    let accW = 0;
    for (let x = 1; x <= numCols; x++) {
      const cell = this.getCellByPoint({ y: 0, x }, 'SYSTEM');
      const w = cell?.width || DEFAULT_WIDTH;
      if (cell?._sys) {
        cell._sys.offsetLeft = headerW + accW;
      }
      accW += w;
    }
    this.totalWidth = headerW + accW;

    // Write offsetTop into row-header cells (y=1..numRows, x=0)
    let accH = 0;
    let fullH = 0;
    for (let y = 1; y <= numRows; y++) {
      const cell = this.getCellByPoint({ y, x: 0 }, 'SYSTEM');
      const h = cell?.height || DEFAULT_HEIGHT;
      if (cell?._sys) {
        cell._sys.offsetTop = headerH + accH;
      }
      if (!cell?.filtered) {
        accH += h;
      }
      fullH += h;
    }
    this.totalHeight = headerH + accH;
    this.fullHeight = headerH + fullH;
  }

  public refresh(relocate = false, resize = false): Sheet {
    this.incrementVersion();
    this.lastChangedTime = this.changedTime;
    this.changedTime = Date.now();

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

  public clone(relocate = false): Sheet {
    const copied: Sheet = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
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
    const cell = this.binding.data[id];
    if (cell == null) {
      return undefined;
    }
    const value =
      (cell.formulaEnabled ?? true)
        ? solveFormula({ value: cell.value, sheet: this, point, raise, refEvaluation, at: id })
        : cell.value;
    return { ...cell, value } as CellType;
  }

  public getCellByAddress(address: Address, refEvaluation: RefEvaluation = 'COMPLETE', raise = false) {
    const point = a2p(address);
    return this.getCellByPoint(point, refEvaluation, raise);
  }

  public getById(id: Id) {
    return this.binding.data[id];
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

  public _toValueMatrix({
    area,
    at,
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
    asScalar = false,
  }: ToValueMatrixProps & { at?: Id } = {}) {
    const { top, left, bottom, right } = area ?? this.area;
    const matrix = createMatrix(bottom - top + 1, right - left + 1);

    // Normalize `at` check to ensure we only throw circular ref if the `at` is from this sheet
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const id = this.getId({ y, x });
        if (at === id) {
          throw new FormulaError('#REF!', 'References are circulating.');
        }
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          let fieldValue = cell.value;
          if (asScalar) {
            const policy = this.getPolicyByPoint({ y, x });
            fieldValue = policy.toScalar({ value: cell.value, cell, sheet: this, point: { y, x } });
          }
          matrix[y - top][x - left] = fieldValue;
        }
      }
    }
    return matrix;
  }

  public toValueMatrix(props: ToValueMatrixProps = {}) {
    return this._toValueMatrix(props);
  }

  public toValueObject({
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
    addresses,
    asScalar = false,
  }: ToValueObjectProps = {}) {
    const result: { [Address: Address]: any } = {};
    if (addresses) {
      for (const addr of addresses) {
        const point = a2p(addr);
        const cell = this.getCellByAddress(addr, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          let fieldValue = cell.value;
          if (asScalar) {
            const policy = this.getPolicyByPoint(point);
            fieldValue = policy.toScalar({ value: cell.value, cell, sheet: this, point });
          }
          result[addr] = fieldValue;
        }
      }
      return result;
    }
    const { top, left, bottom, right } = this.area;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          let fieldValue = cell.value;
          if (asScalar) {
            const policy = this.getPolicyByPoint({ y, x });
            fieldValue = policy.toScalar({ value: cell.value, cell, sheet: this, point: { y, x } });
          }
          result[p2a({ y, x })] = fieldValue;
        }
      }
    }
    return result;
  }

  public toValueRows({
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
    rows,
    asScalar = false,
  }: ToValueRowsProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    const ys = rows ?? Array.from({ length: bottom - top + 1 }, (_, i) => top + i);
    for (const y of ys) {
      const row: CellsByAddressType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          let fieldValue = cell.value;
          if (asScalar) {
            const policy = this.getPolicyByPoint({ y, x });
            fieldValue = policy.toScalar({ value: cell.value, cell, sheet: this, point: { y, x } });
          }
          row[x2c(x)] = fieldValue as any;
        }
      }
    }
    return result;
  }

  public toValueCols({
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
    cols,
    asScalar = false,
  }: ToValueColsProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    const xs = cols
      ? cols.map((c) => (typeof c === 'string' ? c2x(c) : c))
      : Array.from({ length: right - left + 1 }, (_, i) => left + i);
    for (const x of xs) {
      const col: CellsByAddressType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          let fieldValue = cell.value;
          if (asScalar) {
            const policy = this.getPolicyByPoint({ y, x });
            fieldValue = policy.toScalar({ value: cell.value, cell, sheet: this, point: { y, x } });
          }
          col[y2r(y)] = fieldValue as any;
        }
      }
    }
    return result;
  }

  public toCellMatrix({
    area,
    refEvaluation = 'SYSTEM',
    raise = false,
    filter = noFilter,
    ignoreFields = [],
  }: ToCellMatrixProps = {}): (CellType | null)[][] {
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
          const filteredCell = filterCellFields(cell, ignoreFields);
          matrix[y - top][x - left] = filteredCell;
        }
      }
    }
    return matrix;
  }
  public toCellObject({
    refEvaluation = 'SYSTEM',
    raise = false,
    filter = noFilter,
    addresses,
    ignoreFields = [],
  }: ToCellObjectProps = {}) {
    const result: CellsByAddressType = {};
    if (addresses) {
      for (const addr of addresses) {
        const cell = this.getCellByAddress(addr, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          const filteredCell = filterCellFields(cell, ignoreFields);
          result[addr] = filteredCell;
        }
      }
      return result;
    }
    const { top, left, bottom, right } = {
      top: 1,
      left: 1,
      bottom: this.area.bottom,
      right: this.area.right,
    };
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y, x }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          const filteredCell = filterCellFields(cell, ignoreFields);
          result[p2a({ y, x })] = filteredCell;
        }
      }
    }
    return result;
  }
  public toCellRows({
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
    rows,
    ignoreFields = [],
  }: ToCellRowsProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    const ys = rows ?? Array.from({ length: bottom - top + 1 }, (_, i) => top + i);
    for (const y of ys) {
      const row: CellsByAddressType = {};
      result.push(row);
      for (let x = left; x <= right; x++) {
        const cell = this.getCellByPoint({ y: y - top, x: x - left }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          const filteredCell = filterCellFields(cell, ignoreFields);
          row[x2c(x)] = filteredCell;
        }
      }
    }
    return result;
  }
  public toCellCols({
    refEvaluation = 'COMPLETE',
    raise = false,
    filter = noFilter,
    cols,
    ignoreFields = [],
  }: ToCellColsProps = {}) {
    const result: CellsByAddressType[] = [];
    const { top, left, bottom, right } = this.area;
    const xs = cols
      ? cols.map((c) => (typeof c === 'string' ? c2x(c) : c))
      : Array.from({ length: right - left + 1 }, (_, i) => left + i);
    for (const x of xs) {
      const col: CellsByAddressType = {};
      result.push(col);
      for (let y = top; y <= bottom; y++) {
        const cell = this.getCellByPoint({ y: y - top, x: x - left }, refEvaluation, raise) ?? {};
        if (filter(cell)) {
          const filteredCell = filterCellFields(cell, ignoreFields);
          col[y2r(y)] = filteredCell;
        }
      }
    }
    return result;
  }

  private pushHistory(history: HistoryType) {
    const book = this.binding;
    const strayedHistories = book.histories.splice(book.historyIndex + 1, book.histories.length);
    strayedHistories.forEach(this.cleanStrayed.bind(this));
    book.histories.push(history);
    book.lastHistory = book.currentHistory = history;
    if (book.histories.length > book.historyLimit) {
      const kickedOut = book.histories.splice(0, 1)[0];
      this.cleanObsolete(kickedOut);
    } else {
      book.historyIndex++;
    }
  }

  private cleanObsolete(history: HistoryType) {
    if (history.operation === 'REMOVE_ROWS' || history.operation === 'REMOVE_COLS') {
      history.deleted.forEach((ids) => {
        ids.forEach((id) => {
          this.deleteOrphanedId(id);
        });
      });
    }
    if (history.operation === 'MOVE') {
      history.moveRelations.forEach((rel) => {
        if (rel.new != null) {
          this.deleteOrphanedId(rel.new);
        }
        if (rel.lost != null) {
          this.deleteOrphanedId(rel.lost);
        }
      });
    }
  }

  private cleanStrayed(history: HistoryType) {
    if (history.operation === 'INSERT_ROWS' || history.operation === 'INSERT_COLS') {
      history.idMatrix.forEach((ids) => {
        ids.forEach((id) => {
          this.deleteOrphanedId(id);
        });
      });
    }
  }

  /** Remove an id from binding.data and binding.dependents entirely. */
  private deleteOrphanedId(id: Id) {
    delete this.binding.data[id];
    this.binding.dependents.delete(id);
  }

  private setChangedTime(cell?: CellType, changedTime?: number) {
    if (cell?._sys == null) {
      return null;
    }
    cell._sys!.changedTime = changedTime ?? Date.now();
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
    if (cell.policy != null) {
      newCell.policy = cell.policy;
    }
    if (cell.width != null) {
      newCell.width = cell.width;
    }
    if (cell.height != null) {
      newCell.height = cell.height;
    }
    return newCell;
  }

  public move({
    srcSheet = this,
    src,
    dst,
    historicize = true,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: MoveProps) {
    const srcSheetRaw = srcSheet.__raw__;
    const moveRelations = this._createMoveRelations(srcSheetRaw, src, this, dst);
    const { diffBefore, diffAfter } = this._moveCells(srcSheetRaw, this, moveRelations, false, operator);

    this.xsheetDispatch(srcSheetRaw);

    if (historicize) {
      this.pushHistory({
        applyed: true,
        operation: 'MOVE',
        srcSheetId: srcSheetRaw.sheetId,
        dstSheetId: this.sheetId,
        undoReflection,
        redoReflection,
        diffBefore,
        diffAfter,
        moveRelations,
      });
    }

    return this.refresh(true);
  }

  /**
   * Build MoveRelations from src area to dst area, skipping filtered rows.
   *
   * Layout of the returned array (processed in this order by _moveCells):
   *   1. Entries where [0] is a newly-generated ID — these fill the vacated src cells (processed last in forward order)
   *   2. Entries where [0] is a src address and [1] is a dst address — the actual moves (processed first in forward order, descending)
   *   Entries whose [1] is an existing ID mean the destination cell is displaced/overflowed and
   *   is no longer addressable; on forward pass they are skipped; on reverse pass the ID is written back.
   */
  private _createMoveRelations(srcSheet: Sheet, src: AreaType, dstSheet: Sheet, dst: AreaType): MoveRelations {
    const { top: srcTop, left: srcLeft, bottom: srcBottom, right: srcRight } = src;
    const { top: dstTop, left: dstLeft } = dst;

    const dstNumRows = dstSheet.getNumRows();
    const dstNumCols = dstSheet.getNumCols();

    // Collect visible (non-filtered) rows for src
    const srcVisibleRows: number[] = [];
    for (let y = srcTop; y <= srcBottom; y++) {
      if (!srcSheet.isRowFiltered(y)) {
        srcVisibleRows.push(y);
      }
    }
    const srcNumCols = srcRight - srcLeft + 1;
    const srcNumVisibleRows = srcVisibleRows.length;

    // Collect corresponding visible dst rows (skip filtered rows in dst, matching count)
    const dstVisibleRows: number[] = [];
    {
      let di = 0;
      let y = dstTop;
      while (di < srcNumVisibleRows) {
        if (!dstSheet.isRowFiltered(y)) {
          dstVisibleRows.push(y);
          di++;
        }
        y++;
      }
    }

    // Build sets for quick lookup
    const srcCellSet = new Set<string>();
    for (let di = 0; di < srcNumVisibleRows; di++) {
      for (let j = 0; j < srcNumCols; j++) {
        srcCellSet.add(p2a({ y: srcVisibleRows[di], x: srcLeft + j }));
      }
    }

    const dstAddrSet = new Set<string>();
    for (let di = 0; di < srcNumVisibleRows; di++) {
      const dstY = dstVisibleRows[di];
      for (let j = 0; j < srcNumCols; j++) {
        const dstX = dstLeft + j;
        if (dstY <= dstNumRows && dstX <= dstNumCols) {
          dstAddrSet.add(p2a({ y: dstY, x: dstX }));
        }
      }
    }

    const moveRelations: MoveRelations = [];

    for (let di = 0; di < srcNumVisibleRows; di++) {
      const srcY = srcVisibleRows[di];
      const dstY = dstVisibleRows[di];
      for (let j = 0; j < srcNumCols; j++) {
        const srcX = srcLeft + j;
        const dstX = dstLeft + j;
        const srcAddr = p2a({ y: srcY, x: srcX });
        const isDstInBounds = dstY <= dstNumRows && dstX <= dstNumCols;
        const dstAddr = isDstInBounds ? p2a({ y: dstY, x: dstX }) : undefined;

        let newId: Id | undefined;
        // Vacate: src cell is NOT covered by any dst write in the same sheet overlap
        if (!(srcSheet === dstSheet && dstAddrSet.has(srcAddr))) {
          newId = srcSheet.generateId();
        }

        let lostId: Id | undefined;
        if (isDstInBounds) {
          // Displace: dst cell is overwritten but was NOT part of the src area being moved
          if (!(srcSheet === dstSheet && srcCellSet.has(dstAddr!))) {
            const existingId = dstSheet.getId({ y: dstY, x: dstX });
            if (existingId != null) {
              lostId = existingId;
            }
          }
        } else {
          // Overflow: the src ID itself is pushed out of bounds and lost
          const srcId = srcSheet.getId({ y: srcY, x: srcX });
          if (srcId != null) {
            lostId = srcId;
          }
        }

        const srcCell = srcSheet.getCellByPoint({ y: srcY, x: srcX }, 'SYSTEM');
        const dstCell = isDstInBounds ? dstSheet.getCellByPoint({ y: dstY, x: dstX }, 'SYSTEM') : undefined;

        moveRelations.push({
          before: srcCell?.policy,
          after: dstCell?.policy,
          src: srcAddr,
          dst: dstAddr,
          new: newId,
          lost: lostId,
        });
      }
    }

    return moveRelations;
  }

  get defaultPolicy(): PolicyType {
    return this.policies[DEFAULT_POLICY_NAME] ?? nonePolicy;
  }

  /**
   * Apply (or reverse) a MoveRelations list.
   *
   * Forward (reverse=false): process descending — actual ID moves happen bottom-up so
   *   earlier entries don't clobber later ones; vacate entries (at front of array) are
   *   applied last.
   * Reverse (reverse=true): process ascending — restores IDs in the natural order.
   *
   * On forward pass: applies policy, collects diffBefore, runs ReferencePreserver.
   * On reverse pass: only moves IDs (caller is responsible for applyDiff(diffBefore)).
   */
  private _moveCells(
    srcSheet: Sheet,
    dstSheet: Sheet,
    moveRelations: MoveRelations,
    reverse: boolean,
    operator: OperatorType = 'SYSTEM',
  ): { diffBefore: CellsByIdType; diffAfter: CellsByIdType } {
    const diffBefore: CellsByIdType = {};
    const preserver = new ReferencePreserver(dstSheet);

    const wireWrites: CellsByIdType = {};
    const idWritesSrc: Array<{ y: Y; x: X; id: Id }> = [];
    const idWritesDst: Array<{ y: Y; x: X; id: Id }> = [];

    // Forward pass: collect diffs and temporary buffer writes
    if (!reverse) {
      for (const {
        before: beforePolicy,
        after: afterPolicy,
        src: srcAddr,
        dst: dstAddr,
        new: newId,
        lost: lostId,
      } of moveRelations) {
        const srcPoint = a2p(srcAddr);
        const srcId = srcSheet.getId(srcPoint);
        const dstPoint = dstAddr != null ? a2p(dstAddr) : undefined;
        const dstId = dstPoint != null ? dstSheet.getId(dstPoint) : undefined;

        const srcCell = srcId != null ? srcSheet.binding.data[srcId] : undefined;
        const dstCell = dstId != null ? dstSheet.binding.data[dstId] : undefined;

        if (
          operator === 'USER' &&
          (operation.hasOperation(srcCell?.prevention, operation.MoveFrom) ||
            operation.hasOperation(dstCell?.prevention, operation.MoveTo))
        ) {
          continue;
        }

        // Vacate
        if (newId != null) {
          const policyKey = beforePolicy || DEFAULT_POLICY_NAME;
          const policy = srcSheet.policies[policyKey] ?? srcSheet.defaultPolicy;
          const restricted = policy.select({
            sheet: srcSheet,
            point: srcPoint,
            next: { value: null },
            current: srcCell,
            operation: operation.MoveFrom,
          });

          wireWrites[newId] = {
            ...restricted,
            policy: beforePolicy,
            _sys: {
              id: newId,
              sheetId: srcSheet.sheetId,
              changedTime: Date.now(),
            },
          };
          idWritesSrc.push({ y: srcPoint.y, x: srcPoint.x, id: newId });

          if (srcId != null) {
            preserver.map[srcId] = newId;
          }
        }

        // Actual Move
        if (dstId != null && dstPoint != null && dstAddr != null) {
          const dstPolicyKey = afterPolicy || DEFAULT_POLICY_NAME;
          const srcPolicyKey = beforePolicy || DEFAULT_POLICY_NAME;
          const dstPolicyVal = dstSheet.policies[dstPolicyKey] ?? dstSheet.defaultPolicy;
          const srcPolicyVal = srcSheet.policies[srcPolicyKey] ?? srcSheet.defaultPolicy;
          const isSrcWinner = srcPolicyVal.priority > dstPolicyVal.priority;
          const policy = isSrcWinner ? srcPolicyVal : dstPolicyVal;

          const restricted = policy.select({
            sheet: dstSheet,
            point: dstPoint,
            next: srcCell,
            current: dstCell,
            operation: operation.MoveTo,
          });

          if (restricted) {
            diffBefore[srcId] = { ...srcCell };
            wireWrites[srcId] = {
              ...srcCell,
              ...restricted,
              policy: isSrcWinner ? beforePolicy : afterPolicy,
              _sys: {
                id: srcId,
                sheetId: srcSheet.sheetId,
                changedTime: Date.now(),
              },
            };
          }
          if (srcCell != null) {
            srcCell._sys!.changedTime = Date.now();
          }

          idWritesDst.push({ y: dstPoint.y, x: dstPoint.x, id: srcId });

          if (dstId != null) {
            preserver.map[dstId] = srcId;
            preserver.addTheDependents(srcId, dstId);
          }
        }
      }
    } else {
      // Reverse pass: collect id buffer writes (no binding.data modification)
      for (const {
        before: beforePolicy,
        after: afterPolicy,
        src: srcAddr,
        dst: dstAddr,
        new: newId,
        lost: lostId,
      } of moveRelations) {
        // Move ID that landed at dst back to src
        if (dstAddr != null) {
          const toPoint = a2p(dstAddr);
          const movedId = dstSheet.getId(toPoint);
          if (movedId != null) {
            const fromPoint = a2p(srcAddr);
            idWritesSrc.push({ y: fromPoint.y, x: fromPoint.x, id: movedId });
          }
        }

        // Restore lost ID to where it was lost from
        if (lostId != null) {
          if (dstAddr != null) {
            // It was displaced from dst
            const toPoint = a2p(dstAddr);
            idWritesDst.push({ y: toPoint.y, x: toPoint.x, id: lostId });
          } else {
            // It overflowed from src
            const fromPoint = a2p(srcAddr);
            idWritesSrc.push({ y: fromPoint.y, x: fromPoint.x, id: lostId });
          }
        }
      }
    }

    // Flush binding.data writes first
    Object.assign(this.binding.data, wireWrites);
    // Then flush idMatrix writes
    for (const { y, x, id } of idWritesSrc) {
      srcSheet.idMatrix[y][x] = id;
    }
    for (const { y, x, id } of idWritesDst) {
      dstSheet.idMatrix[y][x] = id;
    }

    // Update lastChangedAddresses
    const changedAddresses: Address[] = moveRelations.filter((r) => r.dst != null).map((r) => r.dst as Address);
    const srcAddresses: Address[] = moveRelations.map((r) => r.src);

    if (srcSheet === dstSheet) {
      dstSheet.lastChangedAddresses = [...new Set([...srcAddresses, ...changedAddresses])];
    } else {
      dstSheet.lastChangedAddresses = changedAddresses;
      srcSheet.lastChangedAddresses = srcAddresses;
    }

    if (!reverse) {
      const resolvedDiff = preserver.resolveDependents('move');
      Object.assign(diffBefore, resolvedDiff);
    }

    return { diffBefore, diffAfter: {} };
  }

  public copy({
    srcSheet = this,
    src,
    dst,
    onlyValue = false,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: MoveProps & { onlyValue?: boolean }) {
    const isXSheet = srcSheet !== this;
    const { top: topFrom, left: leftFrom, bottom: bottomFrom, right: rightFrom } = src;
    const { top: topTo, left: leftTo, bottom: bottomTo, right: rightTo } = dst;
    const diff: CellsByAddressType = {};
    const changedTime = Date.now();

    // Build list of visible (non-filtered) rows for src and dst
    const srcVisibleRows: number[] = [];
    for (let y = topFrom; y <= bottomFrom; y++) {
      if (!srcSheet.isRowFiltered(y)) {
        srcVisibleRows.push(y);
      }
    }
    const dstVisibleRows: number[] = [];
    for (let y = topTo; y <= bottomTo; y++) {
      if (y > this.getNumRows()) {
        continue;
      }
      if (!this.isRowFiltered(y)) {
        dstVisibleRows.push(y);
      }
    }

    const srcNumVisibleRows = srcVisibleRows.length;
    const srcNumCols = rightFrom - leftFrom + 1;
    const dstNumCols = rightTo - leftTo + 1;

    for (let di = 0; di < dstVisibleRows.length; di++) {
      const toY = dstVisibleRows[di];
      const fromY = srcVisibleRows[di % srcNumVisibleRows];
      for (let j = 0; j <= dstNumCols - 1; j++) {
        const toX = leftTo + j;
        if (toX > this.getNumCols()) {
          continue;
        }
        const fromX = leftFrom + (j % srcNumCols);
        const slideY = isXSheet ? 0 : toY - fromY;
        const slideX = isXSheet ? 0 : toX - fromX;
        const cell: CellType = {
          ...srcSheet.getCellByPoint({ y: fromY, x: fromX }, 'SYSTEM'),
        };
        const dstPoint = { y: toY, x: toX };
        const dstCell = this.getCellByPoint(dstPoint, 'SYSTEM');
        const dstPolicy = this.getPolicyByPoint(dstPoint);
        const srcPoint = { y: fromY, x: fromX };
        const srcPolicy = srcSheet.getPolicyByPoint(srcPoint);
        const srcCell = srcSheet.getCellByPoint(srcPoint, 'SYSTEM');

        const isSrcWinner = srcPolicy.priority > dstPolicy.priority;
        cell.policy = isSrcWinner ? srcCell?.policy : dstCell?.policy;
        const value =
          (cell?.formulaEnabled ?? true)
            ? identifyFormula(cell?.value, {
                sheet: this,
                dependency: this.getId(dstPoint),
                slideY,
                slideX,
              })
            : cell?.value;
        this.setChangedTime(cell, changedTime);
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
      return this.defaultPolicy;
    }
    return this.policies[cell.policy] ?? this.defaultPolicy;
  }

  private _update({
    diff,
    partial = true,
    updateChangedTime = true,
    ignoreFields = ['label'],
    operator = 'SYSTEM',
    operation: op = operation.Update,
    formulaIdentify = true,
  }: {
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedTime?: boolean;
    ignoreFields?: CellField[];
    operator?: OperatorType;
    operation?: OperationType;
    formulaIdentify?: boolean;
  }) {
    const diffBefore: CellsByIdType = {};
    const diffAfter: CellsByIdType = {};
    const changedAddresses: Address[] = [];
    const changedTime = Date.now();

    let resized = false;
    Object.keys(diff).forEach((address) => {
      const point = a2p(address);
      const id = this.getId(point);
      const current = this.binding.data[id];
      if (operator === 'USER' && operation.hasOperation(current?.prevention, operation.Update)) {
        return;
      }

      let next: Record<string, any> = { ...diff[address] };

      if (formulaIdentify) {
        const formulaEnabled = next.formulaEnabled ?? current?.formulaEnabled ?? true;
        if (formulaEnabled) {
          next.value = identifyFormula(next.value, {
            sheet: this,
            dependency: id,
          });
        }
      }
      ignoreFields.forEach((key) => {
        next[key] = current?.[key];
      });
      if (operator === 'USER' && operation.hasOperation(current?.prevention, operation.Write)) {
        delete next.value;
      }
      if (operator === 'USER' && operation.hasOperation(current?.prevention, operation.Style)) {
        delete next?.style?.justifyContent;
        delete next?.style?.alignItems;
      }
      if (operator === 'USER' && operation.hasOperation(current?.prevention, operation.Resize)) {
        delete next?.style?.width;
        delete next?.style?.height;
      }
      if (updateChangedTime) {
        this.setChangedTime(next, changedTime);
      }
      if (next.width != null || next.height != null) {
        resized = true;
      }
      // must not partial
      diffBefore[id] = current ? { ...current } : {};

      const policy = this.policies[current?.policy || DEFAULT_POLICY_NAME] ?? this.defaultPolicy;
      const p = policy.select({
        sheet: this,
        point,
        next,
        current,
        operation: op,
      });
      next = { ...p, _sys: { ...(current?._sys || {}), changedTime } };
      if (partial) {
        diffAfter[id] = this.binding.data[id] = { ...current, ...next };
      } else {
        diffAfter[id] = this.binding.data[id] = next;
      }
      // null and undefined both mean "empty": don't record a history entry when the
      // value transitions only between these two null-ish states (e.g. undefined → null).
      if (diffBefore[id].value == null && diffAfter[id].value == null) {
        delete diffBefore[id];
        delete diffAfter[id];
      } else {
        changedAddresses.push(address);
      }
    });

    // Store the changed addresses for retrieval via getLastChangedAddresses()
    this.lastChangedAddresses = changedAddresses;

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
    updateChangedTime = true,
    historicize = true,
    operator = 'SYSTEM',
    operation: op = operation.Update,
    ignoreFields,
    undoReflection,
    redoReflection,
  }: {
    diff: CellsByAddressType;
    partial?: boolean;
    updateChangedTime?: boolean;
    historicize?: boolean;
    operator?: OperatorType;
    operation?: OperationType;
    ignoreFields?: CellField[];
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const { diffBefore, diffAfter, resized } = this._update({
      diff,
      partial,
      operator,
      operation: op,
      updateChangedTime,
      ...(ignoreFields != null ? { ignoreFields } : {}),
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
    updateChangedTime = true,
    historicize = true,
    onlyValue = false,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    point: PointType;
    matrix: MatrixType<RawCellType>;
    updateChangedTime?: boolean;
    historicize?: boolean;
    onlyValue?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const { y: baseY, x: baseX } = point;
    const diff: CellsByAddressType = {};

    // Build list of visible (non-filtered) rows starting from baseY
    // Map src row index (i) -> dst y, skipping filtered rows
    let srcRowIndex = 0;
    let dstY = baseY;
    while (srcRowIndex < matrix.length) {
      if (dstY > this.bottom) {
        break;
      }
      if (this.isRowFiltered(dstY)) {
        dstY++;
        continue;
      }
      const cells = matrix[srcRowIndex];
      cells.forEach((newCell, j) => {
        const x = baseX + j;
        if (x > this.right) {
          return;
        }
        const dstPoint = { y: dstY, x };
        const parsed = this.parse(dstPoint, newCell.value ?? '');
        parsed.style = { ...newCell.style, ...parsed.style };
        if (onlyValue) {
          const currentCell = this.getCellByPoint(dstPoint, 'SYSTEM');
          parsed.style = currentCell?.style;
          parsed.justifyContent = currentCell?.justifyContent;
          parsed.alignItems = currentCell?.alignItems;
        }
        diff[p2a(dstPoint)] = parsed;
      });
      srcRowIndex++;
      dstY++;
    }
    return this.update({
      diff,
      partial: true,
      updateChangedTime,
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
    updateChangedTime?: boolean;
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
    updateChangedTime?: boolean;
    historicize?: boolean;
    operator?: OperatorType;
    undoReflection?: StorePatchType;
    redoReflection?: StorePatchType;
  }) {
    const { point, value } = props;
    const parsed = this.parse(point, value ?? '');
    const current = this.getCellByPoint(point, 'RAW');
    if ((current?.value ?? null) === parsed.value) {
      // no change (treat undefined and null as equivalent empty values)
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
    updateChangedTime,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    y: number;
    numRows: number;
    baseY: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedTime?: boolean;
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
    const changedTime = Date.now();
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j <= numCols; j++) {
        const id = this.generateId();
        row.push(id);
        const cell = this.getCellByPoint({ y: baseY, x: j }, 'SYSTEM');
        const copied = this.copyCellLayout(cell);
        this.binding.data[id] = {
          ...copied,
          _sys: {
            id,
            sheetId: this.sheetId,
            changedTime,
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
      Object.assign(this.binding.lastHistory!, this._update({ diff, partial, updateChangedTime, operator }), {
        partial,
      });
    }
    if (this.binding.onInsertRows) {
      const cloned = this.clone();
      cloned.area = {
        top: y,
        bottom: y + numRows - 1,
        left: this.area.left,
        right: this.area.right,
      };
      cloned.addressCaches = new Map();
      this.binding.onInsertRows({ sheet: cloned, y, numRows });
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

    if (this.binding.onRemoveRows) {
      const cloned = this.clone();
      cloned.idMatrix = backup;
      cloned.area = {
        top: y,
        bottom: y + numRows - 1,
        left: this.area.left,
        right: this.area.right,
      };
      cloned.addressCaches = new Map();
      this.binding.onRemoveRows({ sheet: cloned, ys: ys.reverse() });
    }
    return this.refresh(true, true);
  }

  public insertCols({
    x,
    numCols,
    baseX,
    diff,
    partial,
    updateChangedTime,
    operator = 'SYSTEM',
    undoReflection,
    redoReflection,
  }: {
    x: number;
    numCols: number;
    baseX: number;
    diff?: CellsByAddressType;
    partial?: boolean;
    updateChangedTime?: boolean;
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
    const changedTime = Date.now();
    for (let i = 0; i <= numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this.generateId();
        row.push(id);
        const cell = this.getCellByPoint({ y: i, x: baseX }, 'SYSTEM');
        const copied = this.copyCellLayout(cell);
        this.idMatrix[i].splice(x, 0, id);
        this.binding.data[id] = {
          ...copied,
          _sys: {
            id,
            sheetId: this.sheetId,
            changedTime,
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
      Object.assign(this.binding.lastHistory!, this._update({ diff, partial, updateChangedTime, operator }), {
        partial,
      });
    }
    if (this.binding.onInsertCols) {
      const cloned = this.clone();
      cloned.area = {
        top: this.area.top,
        bottom: this.area.bottom,
        left: x,
        right: x + numCols - 1,
      };
      cloned.addressCaches = new Map();
      this.binding.onInsertCols({ sheet: cloned, x, numCols });
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

    if (this.binding.onRemoveCols) {
      const cloned = this.clone();
      cloned.idMatrix = backup;
      cloned.area = {
        top: this.area.top,
        bottom: this.area.bottom,
        left: x,
        right: x + numCols - 1,
      };
      cloned.addressCaches = new Map();
      this.binding.onRemoveCols({ sheet: cloned, xs: xs.reverse() });
    }
    return this.refresh(true, true);
  }
  public getHistories() {
    return [...this.binding.histories];
  }
  public getHistoryIndex() {
    return this.binding.historyIndex;
  }
  public getHistorySize() {
    return this.binding.histories.length;
  }
  public getHistoryLimit() {
    return this.binding.historyLimit;
  }

  public getArea(): AreaType {
    return { ...this.area };
  }

  public parse(point: PointType, value: any): CellType {
    const cell = this.getCellByPoint(point, 'SYSTEM') ?? {};
    const policy = this.getPolicyByPoint(point);
    return policy.deserializeValue(value, cell);
  }

  public render(props: RenderProps) {
    const { point, sync } = props;
    const policy = this.getPolicyByPoint(point);
    return policy.render({ sheet: this, point, sync });
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
      // Use raw cell from binding so cell.value is the original formula string.
      // getCellByPoint(raise=false) would replace cell.value with undefined, losing the formula.
      const id = this.idMatrix[point.y]?.[point.x];
      cell = id != null ? this.binding.data[id] : undefined;
    }
    if (cell == null) {
      return '';
    }
    const policy = this.getPolicyByPoint(point);
    const s = policy.serialize({ value: cell.value, cell, sheet: this, point });

    if (s[0] === '=') {
      if (refEvaluation === 'SYSTEM') {
        return s; // do not evaluate system references
      }
      if (refEvaluation === 'RAW') {
        const lexer = new Lexer(s.substring(1));
        lexer.tokenize();
        return '=' + lexer.display({ sheet: this });
      }
      try {
        const id = this.idMatrix[point.y]?.[point.x];
        const solved = solveFormula({ value: s, sheet: this, point, raise: true, refEvaluation, at: id });
        const value = stripSheet({ value: solved, raise: false });
        return policy.serialize({ value, cell, sheet: this, point });
      } catch (e) {
        if (e instanceof FormulaError) {
          return e.code;
        }
        return '';
      }
    }
    return s;
  }

  public trim(area: AreaType): Sheet {
    const copied: Sheet = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    copied.area = area;
    // this causes RangeError on circular reference(maximum call stack size exceeded)
    // copied.solvedCaches = {};
    return copied;
  }

  /**
   * Solve all formulas in this sheet and return a 2D matrix of resolved values.
   */
  public solve({ raise = false, at }: { raise?: boolean; at: Id }): any[][] {
    return solveSheet({ sheet: this, raise, at });
  }

  /**
   * Collapse this sheet to a scalar (top-left cell value).
   */
  public strip(): any {
    return stripSheet({ value: this, raise: false });
  }

  private applyDiff(diff: CellsByIdType = {}, partial = true) {
    const ids = Object.keys(diff);
    ids.forEach((id) => {
      const cell = diff[id] ?? {};
      this.setChangedTime(cell);
      this.binding.data[id] = partial ? { ...this.getById(id), ...cell } : { ...cell };
    });
    const addresses: Address[] = [];
    for (const id of ids) {
      const address = this.getAddressById(id);
      if (address) {
        addresses.push(address);
      }
    }
    this.lastChangedAddresses = addresses;
  }

  public undo() {
    if (this.binding.historyIndex < 0) {
      return { history: null, newSheet: this.__raw__ };
    }
    const history = this.binding.histories[this.binding.historyIndex--];
    history.applyed = false;
    this.binding.currentHistory = this.binding.histories[this.binding.historyIndex];

    const srcSheet = this.getSheetBySheetId(history.srcSheetId);
    const dstSheet = this.getSheetBySheetId(history.dstSheetId);

    if (!dstSheet) {
      return { history: null, newSheet: this.__raw__ };
    }

    switch (history.operation) {
      case 'UPDATE':
        dstSheet.applyDiff(history.diffBefore, false);
        break;
      case 'INSERT_ROWS': {
        if (history.diffBefore) {
          dstSheet.applyDiff(history.diffBefore, false);
        }
        const { rows } = matrixShape({ matrix: history.idMatrix });
        dstSheet.idMatrix.splice(history.y, rows);
        dstSheet.area.bottom -= rows;
        break;
      }
      case 'INSERT_COLS': {
        if (history.diffBefore) {
          dstSheet.applyDiff(history.diffBefore, false);
        }
        const { cols } = matrixShape({ matrix: history.idMatrix });
        dstSheet.idMatrix.forEach((row) => {
          row.splice(history.x, cols);
        });
        dstSheet.area.right -= cols;
        break;
      }
      case 'REMOVE_ROWS': {
        const { ys, deleted } = history;
        ys.forEach((y, i) => {
          dstSheet.idMatrix.splice(y, 0, deleted[i]);
        });
        dstSheet.area.bottom += ys.length;
        this.applyDiff(history.diffBefore, false);
        break;
      }
      case 'REMOVE_COLS': {
        const { xs, deleted } = history;
        dstSheet.idMatrix.forEach((row, i) => {
          for (let j = 0; j < xs.length; j++) {
            row.splice(xs[j], 0, deleted[i][j]);
          }
        });
        dstSheet.area.right += xs.length;
        this.applyDiff(history.diffBefore, false);
        break;
      }
      case 'MOVE': {
        if (srcSheet) {
          this._moveCells(srcSheet, dstSheet, history.moveRelations, true);
        }
        const movedAddresses = dstSheet.lastChangedAddresses;
        dstSheet.applyDiff(history.diffBefore, false);
        dstSheet.lastChangedAddresses = [...new Set([...movedAddresses, ...dstSheet.lastChangedAddresses])];
        break;
      }
      case 'SORT_ROWS': {
        dstSheet._sortRowMapping(history.sortedRowMapping, true);
        dstSheet._reapplyFilters();
        break;
      }
    }
    this.refresh(shouldTracking(history.operation), true);
    if (dstSheet !== this) {
      dstSheet.addressCaches.clear();
      dstSheet.setTotalSize();
    }
    if (history.operation === 'MOVE' && srcSheet && srcSheet !== dstSheet) {
      this.xsheetDispatch(srcSheet);
    }
    return {
      history,
      callback: ({ sheetReactive: sheetRef }: StoreType) => {
        sheetRef.current?.binding.transmit(history.undoReflection?.transmit);
      },
    };
  }

  public redo() {
    if (this.binding.historyIndex + 1 >= this.binding.histories.length) {
      return { history: null, newSheet: this.__raw__ };
    }
    const history = this.binding.histories[++this.binding.historyIndex];
    history.applyed = true;
    this.binding.currentHistory = history;

    const srcSheet = this.getSheetBySheetId(history.srcSheetId);
    const dstSheet = this.getSheetBySheetId(history.dstSheetId);

    if (!dstSheet) {
      return { history: null, newSheet: this.__raw__ };
    }

    switch (history.operation) {
      case 'UPDATE':
        dstSheet.applyDiff(history.diffAfter, false);
        break;
      case 'INSERT_ROWS': {
        if (history.diffAfter) {
          dstSheet.applyDiff(history.diffAfter, false);
        }
        const { rows } = matrixShape({ matrix: history.idMatrix });
        dstSheet.idMatrix.splice(history.y, 0, ...history.idMatrix);
        dstSheet.area.bottom += rows;
        break;
      }
      case 'INSERT_COLS': {
        if (history.diffAfter) {
          dstSheet.applyDiff(history.diffAfter, false);
        }
        const { cols } = matrixShape({ matrix: history.idMatrix });
        dstSheet.idMatrix.map((row, i) => {
          row.splice(history.x, 0, ...history.idMatrix[i]);
        });
        dstSheet.area.right += cols;
        break;
      }
      case 'REMOVE_ROWS': {
        dstSheet.removeRows({
          y: history.ys[0],
          numRows: history.ys.length,
          operator: 'SYSTEM',
          undoReflection: history.undoReflection,
          redoReflection: history.redoReflection,
        });
        break;
      }
      case 'REMOVE_COLS': {
        dstSheet.removeCols({
          x: history.xs[0],
          numCols: history.xs.length,
          operator: 'SYSTEM',
          undoReflection: history.undoReflection,
          redoReflection: history.redoReflection,
        });
        break;
      }
      case 'MOVE': {
        if (srcSheet) {
          this._moveCells(srcSheet, dstSheet, history.moveRelations, false);
        }
        break;
      }
      case 'SORT_ROWS': {
        dstSheet._sortRowMapping(history.sortedRowMapping, false);
        dstSheet._reapplyFilters();
        break;
      }
    }
    this.refresh(shouldTracking(history.operation), true);
    if (dstSheet !== this) {
      dstSheet.addressCaches.clear();
      dstSheet.setTotalSize();
    }
    if (history.operation === 'MOVE' && srcSheet && srcSheet !== dstSheet) {
      this.xsheetDispatch(srcSheet);
    }
    return {
      history,
      callback: ({ sheetReactive: sheetRef }: StoreType) => {
        sheetRef.current?.binding.transmit(history.redoReflection?.transmit);
      },
    };
  }
  public getFunction(name: string) {
    return this.functions[name];
  }

  public getLabel(label: string | undefined, point: PointType, n: number): string | null {
    if (label != null) {
      return label;
    }
    const policy = this.getPolicyByPoint(point);
    return (point.x === 0 ? policy.renderRowHeaderLabel(n) : policy.renderColHeaderLabel(n)) ?? null;
  }
  public getBase() {
    return this;
  }

  public addDependents(id: Id, dependency: string): void {
    let set = this.binding.dependents.get(id);
    if (set == null) {
      set = new Set();
      this.binding.dependents.set(id, set);
    }
    set.add(dependency);
  }

  public getSolvedCache(point: PointType): [boolean, any] {
    const id = this.getId(point);
    return [this.binding.solvedCaches.has(id), this.binding.solvedCaches.get(id)];
  }
  public setSolvingCache(point: PointType) {
    const id = this.getId(point);
    this.binding.solvedCaches.set(id, SOLVING);
    const cell = this.binding.data[id];
    if (cell) {
      ensureSys(cell, { tmpAsyncCaches: {} });
    }
  }

  public finishSolvedCache(point: PointType, value: any) {
    if (SOLVING.is(value)) {
      return;
    }

    const id = this.getId(point);
    this.binding.solvedCaches.set(id, value);

    const cell = this.binding.data[id];
    if (cell == null) {
      return;
    }
    const tmp = cell._sys?.tmpAsyncCaches;

    if (tmp != null) {
      if (Object.keys(tmp).length > 0) {
        cell.asyncCaches = tmp;
      } else {
        delete cell.asyncCaches;
      }
      delete cell._sys!.tmpAsyncCaches;
    }
  }

  public clearSolvedCaches() {
    this.binding.solvedCaches.clear();
    for (const id of this.binding.lastSpilledTargetIds) {
      const cell = this.binding.data[id];
      if (cell?._sys?.spilledFrom != null) {
        delete cell._sys.spilledFrom;
      }
    }
    this.binding.lastSpilledTargetIds.clear();
  }

  /**
   * Spill a 2D matrix of values starting from the origin cell.
   * The origin cell receives matrix[0][0] and adjacent cells receive spill values in solvedCaches.
   * For a 1×1 matrix, no spill occurs — the single value is cached directly.
   * Throws FormulaError('#REF!') if the spill range is obstructed.
   *
   * @param origin  The anchor cell that produced the spill.
   * @param matrix  The 2D array of resolved scalar values.
   * @returns The top-left value (matrix[0][0]).
   */
  public spill(origin: PointType, matrix: any[][]): any {
    const numRows = matrix.length;
    const numCols = numRows > 0 ? matrix[0].length : 0;

    // Single cell result (1×1) — no spill needed
    if (numRows <= 1 && numCols <= 1) {
      return matrix[0]?.[0];
    }

    // Multi-cell result — check for obstructions
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        const targetPoint = { y: origin.y + i, x: origin.x + j };
        const targetId = this.getId(targetPoint);
        const address = p2a(targetPoint);
        if (targetId == null) {
          console.warn(`Spill target ${address} is out of bounds.`);
          continue;
        }
        const targetCell = this.getById(targetId);
        if (targetCell?.value != null && targetCell.value !== '') {
          throw new FormulaError(
            '#REF!',
            `Array result was not expanded because it would overwrite data in ${address}.`,
          );
        }
        // If solvedCaches already has an entry for this cell, another formula
        // (including another spill) has already written here — treat as obstruction.
        if (this.binding.solvedCaches.has(targetId)) {
          throw new FormulaError(
            '#REF!',
            `Array result was not expanded because ${address} is already occupied by another formula.`,
          );
        }
      }
    }

    // All clear — write values into solvedCaches
    const originId = this.getId(origin);
    const spilledAddresses: Address[] = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        const targetPoint = { y: origin.y + i, x: origin.x + j };
        const targetId = this.getId(targetPoint);
        if (targetId == null) {
          continue;
        }
        this.finishSolvedCache(targetPoint, matrix[i][j]);
        if (i !== 0 || j !== 0) {
          spilledAddresses.push(p2a(targetPoint));
          // Mark target cell as spilled from the origin formula cell
          if (originId != null) {
            const targetCell = this.binding.data[targetId];
            if (targetCell != null) {
              ensureSys(targetCell, {});
              targetCell._sys!.spilledFrom = p2a(origin);
              this.binding.lastSpilledTargetIds.add(targetId);
            }
          }
        }
      }
    }

    return matrix[0][0];
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

  get __raw__(): Sheet {
    return this;
  }

  get shape() {
    return areaShape({ base: 1, ...this.area });
  }
  get hasSingleCell() {
    const shape = this.shape;
    return shape.rows === 1 && shape.cols === 1;
  }
  get currentVersion() {
    return this.version;
  }
}

export const escapeSheetName = (name: string): string => {
  const escaped = name.replace(/'/g, "''");
  return `'${escaped}'`;
};

export const getSheetPrefix = (name?: string): string => {
  if (name) {
    return `${escapeSheetName(name)}!`;
  }
  return '';
};
