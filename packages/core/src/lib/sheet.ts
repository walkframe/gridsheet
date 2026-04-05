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
  RefLike,
  Resolution,
  MoveRelations,
  Y,
  X,
  System,
} from '../types';
import { among, areaShape, createMatrix, expandRange, getMaxSizesFromCells, matrixShape } from './spatial';
import { a2p, x2c, c2x, p2a, y2r, grantAddressAbsolute } from './coords';
import type { FunctionMapping } from '../formula/functions/__base';
import { Lexer, ProcessFormulaProps } from '../formula/evaluator';
import { FormulaError } from '../formula/formula-error';
import { solveFormula, SolveOptions, solveSheet, stripSheet } from '../formula/solver';
import { ensureSys, filterCellFields } from './cell';
import { escapeSheetName, toSheetPrefix } from './sheet_utils';

import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  HEADER_HEIGHT,
  HEADER_WIDTH,
  DEFAULT_HISTORY_LIMIT,
  DEFAULT_KEY,
  DEFAULT_COL_KEY,
  DEFAULT_ROW_KEY,
} from '../constants';
import { Pending, SOLVING, NONE, Spilling } from '../sentinels';
import * as operation from './operation';

const shouldTracking = (op: string) => {
  switch (op) {
    case 'INSERT_ROWS':
    case 'INSERT_COLS':
    case 'REMOVE_ROWS':
    case 'REMOVE_COLS':
    case 'MOVE':
    case 'SORT_ROWS':
      return true;
  }
  return false;
};
import { Registry, createRegistry } from './book';
import { nonePolicy, PolicyType, DEFAULT_POLICY_NAME, RenderProps, ScalarProps } from '../policy/core';
import { evaluateFilterConfig } from './filter';
import { ReferencePreserver } from './reference';

type CellField = keyof CellType;

export type SheetLimits = {
  minRows?: number;
  maxRows?: number;
  minCols?: number;
  maxCols?: number;
};

type Props = {
  limits?: SheetLimits;
  functions?: FunctionMapping;
  name?: string;
  registry?: Registry;
};

const noFilter: CellFilter = () => true;

type MoveProps = {
  srcSheet?: UserSheet;
  src: AreaType;
  dst: AreaType;
  operator?: OperatorType;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  historicize?: boolean;
};

export interface UserSheet {
  changedTime: number;
  lastChangedTime?: number;
  area: AreaType;
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
  name: string;

  /**
   * Returns the raw sheet object, which is used for internal operations.
   * This is not intended for public use and may change in future versions.
   */
  __raw__: Sheet;

  getRectSize(area: AreaType): RectType;
  getCell(point: PointType, options?: { resolution?: Resolution; raise?: boolean }): CellType | undefined;
  getPolicy(point: PointType): PolicyType;
  get numRows(): number;
  get numCols(): number;
  get shape(): ShapeType;
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
  histories(): HistoryType[];
  historyIndex(): number;
  historySize(): number;
  setHeaderHeight(height: number, historicize?: boolean): UserSheet;
  setHeaderWidth(width: number, historicize?: boolean): UserSheet;

  sortRows(args: { x: number; direction: 'asc' | 'desc' }): UserSheet;

  filterRows(args?: { x?: number; filter?: FilterConfig }): UserSheet;
  isRowFiltered(y: number): boolean;
  hasActiveFilters(): boolean;
  hasPendingCells(): boolean;
  waitForPending(): Promise<void>;
  getLastChangedAddresses(): Address[];
  getSerializedValue(props: { point: PointType; cell?: CellType; resolution?: Resolution }): string;
}

type InternalToValueMatrixProps = {
  area?: AreaType;
  resolution?: Resolution;
  raise?: boolean;
  filter?: CellFilter;
  asScalar?: boolean;
  at?: Id;
};

export class Sheet implements UserSheet {
  /** @internal */
  public __gsType = 'Sheet';
  /** Cached result of strip (NONE = not yet stripped). */
  private _stripped: any = NONE;
  public changedTime: number;
  public lastChangedTime?: number;
  public area: AreaType = { top: 0, left: 0, bottom: 0, right: 0 };

  /** @internal */
  private _limits: Required<SheetLimits>;
  get minNumRows() {
    return this._limits.minRows;
  }
  get maxNumRows() {
    return this._limits.maxRows;
  }
  get minNumCols() {
    return this._limits.minCols;
  }
  get maxNumCols() {
    return this._limits.maxCols;
  }
  /** @internal */
  public id: number = 0;
  public name: string = '';
  /** @internal */
  public prevName: string = '';
  /** @internal */
  public status: 0 | 1 | 2 = 0; // 0: not initialized, 1: initialized, 2: formula absoluted
  /** @internal */
  public registry: Registry;
  /** @internal */
  public idsToBeIdentified: Id[] = [];
  /** @internal */
  public totalWidth = 0;
  /** @internal */
  public totalHeight = 0;
  /** @internal */
  public fullHeight = 0;
  /** @internal */
  public defaultColWidth: number = DEFAULT_WIDTH;
  /** @internal */
  public defaultRowHeight: number = DEFAULT_HEIGHT;

  /** @internal */
  private version = 0;
  /** @internal */
  private idMatrix: IdMatrix;
  /** @internal */
  private addressCaches: Map<Id, Address> = new Map();
  /** @internal */
  private lastChangedAddresses: Address[] = [];
  /** @internal — stored cell defaults from initialize() for lazy cell resolution */
  private _initCells: CellsByAddressType | null = null;
  /** @internal — default cell config from cells['default'] / cells['*'] */
  private _common: CellType | undefined;
  /** @internal — default column config from cells['defaultCol'] / cells['*C'] */
  private _commonCol: CellType | undefined;
  /** @internal — default row config from cells['defaultRow'] / cells['*R'] */
  private _commonRow: CellType | undefined;
  /** @internal — deferred matrices from buildInitialCells (large datasets) */
  private _initMatrices: { [baseAddress: string]: any[][] } | null = null;
  /** @internal — flattenAs key for deferred matrices */
  private _initFlattenAs: string | undefined;
  /** @internal — parsed base points for each matrix key, cached once */
  private _matrixBases: { baseY: number; baseX: number; rows: number; cols: number }[] = [];
  /** @internal — raw matrix references keyed by base address for O(1) lookup */
  private _matrixByBase: { baseY: number; baseX: number; matrix: any[][] }[] = [];
  /** @internal — precomputed column letters for lazy ID row creation */
  private _colLetters: string[] = [];
  /** @internal — tracks custom row heights (row y → height) for arithmetic offset computation */
  private _rowHeightOverrides: Map<number, number> = new Map();
  /** @internal — tracks filtered rows for offset computation */
  private _filteredRows: Set<number> = new Set();

  constructor({ limits = {}, name, registry = createRegistry({}) }: Props) {
    this.idMatrix = [];
    this.changedTime = Date.now();
    this._limits = {
      minRows: limits.minRows ?? 1,
      maxRows: limits.maxRows ?? -1,
      minCols: limits.minCols ?? 1,
      maxCols: limits.maxCols ?? -1,
    };
    this.name = name || '';
    this.prevName = this.name;
    this.registry = registry;
  }

  static is(obj: any): obj is Sheet {
    return obj?.__gsType === 'Sheet';
  }

  toString() {
    return `Sheet(name=${escapeSheetName(this.name)}, top=${this.top}, left=${this.left}, bottom=${this.bottom}, right=${this.right})`;
  }

  get headerHeight() {
    return this.getCell({ y: 0, x: 0 }, { resolution: 'SYSTEM' })?.height || HEADER_HEIGHT;
  }

  setHeaderHeight(height: number, historicize = true) {
    return this.update({
      diff: { 0: { height } },
      partial: true,
      historicize,
    });
  }

  get headerWidth() {
    return this.getCell({ y: 0, x: 0 }, { resolution: 'SYSTEM' })?.width || HEADER_WIDTH;
  }

  setHeaderWidth(width: number, historicize = true) {
    return this.update({
      diff: { 0: { width } },
      partial: true,
      historicize,
    });
  }

  /**
   * Get the raw (mutable) cell data for a point. Unlike getCell, this returns the actual registry.data reference.
   * @internal
   */
  private _pointToRawCell({ y, x }: PointType): CellType | undefined {
    const id = this.getId({ y, x });
    if (id == null) {
      return undefined;
    }
    this._ensureCellPopulated(y, x, id);
    return this.registry.data[id];
  }

  public isRowFiltered(y: number): boolean {
    return !!this._pointToRawCell({ y, x: 0 })?.filtered;
  }

  public hasActiveFilters(): boolean {
    const numCols = this.numCols;
    for (let col = 1; col <= numCols; col++) {
      const colCell = this._pointToRawCell({ y: 0, x: col });
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
    // Only check materialized cells — unmaterialized cells can't have Pending values
    for (const id of Object.keys(this.registry.data)) {
      const cell = this.registry.data[id];
      if (Pending.is(cell?.value)) {
        return true;
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
    const pendingMap = this.registry.asyncPending;
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
          if (this.registry.asyncPending.size > 0) {
            const promises = Array.from(this.registry.asyncPending.values()).map((p) => p.promise);
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

  /**
   * Capture the full cell state of all filter-related header cells as a CellsByIdType snapshot.
   * @internal
   */
  private _captureFilterCellStates(): CellsByIdType {
    const snapshot: CellsByIdType = {};
    const numCols = this.numCols;
    const numRows = this.numRows;
    // Column header cells: capture the 'filter' field.
    // Use null instead of undefined so the value survives JSON serialization
    // (undefined is stripped by JSON.stringify, causing undo to silently no-op in environments
    // that serialize/deserialize state such as StackBlitz hot-reload).
    for (let col = 1; col <= numCols; col++) {
      const id = this.getId({ y: 0, x: col });
      if (id != null) {
        snapshot[id] = { filter: this.registry.data[id]?.filter ?? null };
      }
    }
    // Row header cells: capture the 'filtered' field.
    // Use false instead of undefined so the value survives JSON serialization
    // (undefined is stripped by JSON.stringify, causing undo to silently no-op in environments
    // that serialize/deserialize state such as StackBlitz hot-reload).
    for (let y = 1; y <= numRows; y++) {
      const id = this.getId({ y, x: 0 });
      if (id != null) {
        snapshot[id] = { filtered: this.registry.data[id]?.filtered ?? false };
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
      const numCols = this.numCols;
      for (let col = 1; col <= numCols; col++) {
        const colCell = this._pointToRawCell({ y: 0, x: col });
        delete colCell?.filter;
      }
    } else {
      const colCell = this._pointToRawCell({ y: 0, x });
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

    // Only keep cells whose state actually changed
    const changedIds = Object.keys(diffBefore).filter(
      (id) => JSON.stringify(diffBefore[id]) !== JSON.stringify(diffAfter[id]),
    );

    if (changedIds.length > 0) {
      const trimmedBefore: CellsByIdType = {};
      const trimmedAfter: CellsByIdType = {};
      for (const id of changedIds) {
        trimmedBefore[id] = diffBefore[id];
        trimmedAfter[id] = diffAfter[id];
      }
      this._pushHistory({
        applyed: true,
        operation: 'UPDATE',
        srcSheetId: this.id,
        dstSheetId: this.id,
        diffBefore: trimmedBefore,
        diffAfter: trimmedAfter,
        partial: true,
      });
    }

    return this.refresh(false, true);
  }

  /** @internal */
  private _reapplyFilters() {
    // Collect active filters from column header cells
    const numCols = this.numCols;
    const activeFilters: { x: number; filter: FilterConfig }[] = [];
    const changedAddresses: Address[] = [];
    for (let col = 1; col <= numCols; col++) {
      const colCell = this._pointToRawCell({ y: 0, x: col });
      if (colCell?.filter && colCell.filter.conditions.length > 0) {
        activeFilters.push({ x: col, filter: colCell.filter });
      }
      // Track column header cells that have filter config changes
      changedAddresses.push(p2a({ y: 0, x: col }));
    }

    const numRows = this.numRows;

    // Evaluate each row and update filtered flag
    for (let y = 1; y <= numRows; y++) {
      const rowCell = this._pointToRawCell({ y, x: 0 });
      if (!rowCell) {
        continue;
      }

      if (rowCell.filterFixed) {
        continue;
      }

      let shouldFilter = false;
      for (const { x: col, filter } of activeFilters) {
        const cell = this.getCell({ y, x: col }, { resolution: 'RESOLVED' });
        if (!evaluateFilterConfig(filter, cell?.value)) {
          shouldFilter = true;
          break;
        }
      }

      const wasFiltered = !!rowCell.filtered;
      if (shouldFilter) {
        rowCell.filtered = true;
        this._filteredRows.add(y);
      } else {
        delete rowCell.filtered;
        this._filteredRows.delete(y);
      }
      if (wasFiltered !== shouldFilter) {
        changedAddresses.push(p2a({ y, x: 0 }));
      }
    }

    this.lastChangedAddresses = changedAddresses;
  }

  public sortRows({ x, direction }: { x: number; direction: 'asc' | 'desc' }) {
    const numRows = this.numRows;
    if (numRows <= 1) {
      return this;
    }

    // Collect row indices (data rows: 1..numRows), separating fixed rows
    const fixedPositions = new Set<number>();
    const sortableIndices: number[] = [];
    for (let y = 1; y <= numRows; y++) {
      const rowCell = this._pointToRawCell({ y, x: 0 });
      if (rowCell?.sortFixed) {
        fixedPositions.add(y);
      } else {
        sortableIndices.push(y);
      }
    }

    // Sort by resolved cell value at column x
    sortableIndices.sort((a, b) => {
      const cellA = this.getCell({ y: a, x }, { resolution: 'RESOLVED' });
      const cellB = this.getCell({ y: b, x }, { resolution: 'RESOLVED' });
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

    // Check if order actually changed (only among sortable rows)
    // Assign sortable rows to the positions not occupied by fixed rows
    const availablePositions: number[] = [];
    for (let y = 1; y <= numRows; y++) {
      if (!fixedPositions.has(y)) {
        availablePositions.push(y);
      }
    }

    let changed = false;
    for (let i = 0; i < sortableIndices.length; i++) {
      if (sortableIndices[i] !== availablePositions[i]) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      return this;
    }

    // Build row mapping: original position -> new position
    // Fixed rows map to themselves; sortable rows map to available positions in sorted order
    const sortedRowMapping: { [beforeY: number]: number } = {};
    for (const y of fixedPositions) {
      sortedRowMapping[y] = y;
    }
    for (let i = 0; i < sortableIndices.length; i++) {
      sortedRowMapping[sortableIndices[i]] = availablePositions[i];
    }

    // Save row references before rearranging (rows are re-slotted, not mutated).
    this._materializeIdMatrix();
    const matrixSnapshot = this.idMatrix.slice();

    for (const [oldY, newY] of Object.entries(sortedRowMapping)) {
      this.idMatrix[Number(newY)] = matrixSnapshot[Number(oldY)];
    }
    this.addressCaches.clear();

    const preserver = new ReferencePreserver(this);
    preserver.buildMap(matrixSnapshot.flat(), this.idMatrix.flat());
    preserver.resolveDependents();

    this._pushHistory({
      applyed: true,
      operation: 'SORT_ROWS',
      srcSheetId: this.id,
      dstSheetId: this.id,
      sortedRowMapping,
    } as HistorySortRowsType);

    return this.refresh(true, true);
  }

  /** @internal */
  private _sortRowMapping(sortedRowMapping: { [beforeY: number]: number }, inverse = false) {
    const newOrder: number[] = new Array(this.numRows);

    if (inverse) {
      for (const [oldYStr, newY] of Object.entries(sortedRowMapping)) {
        const oldY = Number(oldYStr);
        newOrder[oldY - 1] = newY;
      }
    } else {
      for (const [oldYStr, newY] of Object.entries(sortedRowMapping)) {
        const oldY = Number(oldYStr);
        newOrder[newY - 1] = oldY;
      }
    }

    this._materializeIdMatrix();
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

  get policies() {
    return this.registry.policies;
  }

  /** @internal */
  public getSystem(point: PointType): System | undefined {
    const id = this.getId(point);
    if (id == null) {
      return undefined;
    }
    return this.registry.systems[id];
  }

  /** @internal */
  public processFormula(value: any, { idMap, ...props }: ProcessFormulaProps): any {
    if (typeof value === 'string' || value instanceof String) {
      if (value.charAt(0) === '=') {
        const lexer = new Lexer(value.substring(1));
        lexer.tokenize(idMap);
        lexer.identify({ ...props, sheet: this });
        lexer.dependencyIds.forEach((id) => this.addDependency(id, props.dependency));
        return '=' + lexer.identifiedFormula;
      }
    }
    return value;
  }

  /** @internal */
  public resolveFormulas() {
    this.idsToBeIdentified.forEach((id) => {
      const cell = this.registry.data[id];
      if (this.registry.systems[id]?.sheetId == null) {
        return;
      }
      if (cell == null) {
        return;
      }
      this.clearDependencies(id);
      cell.value = this.processFormula(cell?.value, { dependency: id });
    });
    this.idsToBeIdentified = [];
    this.status = 2;
  }

  /** @internal */
  public getSheetBySheetName(sheetName: string) {
    const sheetId = this.registry.sheetIdsByName[sheetName];
    return this.getSheetBySheetId(sheetId);
  }
  /** @internal */
  public getSheetBySheetId(sheetId: number) {
    return this.registry.contextsBySheetId[sheetId]?.store?.sheetReactive?.current;
  }

  /** @internal */
  private static _stack(...cells: (CellType | undefined)[]) {
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

  /** @internal */
  public initialize(cells: CellsByAddressType) {
    if (this.status > 1) {
      return;
    }
    if (cells[0] == null) {
      cells[0] = { width: HEADER_WIDTH, height: HEADER_HEIGHT };
    }
    const auto = getMaxSizesFromCells(cells, (cells as any).__userKeys);
    this.area = {
      top: 1,
      left: 1,
      bottom: auto.numRows,
      right: auto.numCols,
    };

    // Pre-allocate idMatrix with undefined slots (O(1) — no ID generation)
    this.idMatrix = new Array(auto.numRows + 1);

    // Precompute column letters for lazy row creation
    this._colLetters = [];
    for (let x = 0; x <= auto.numCols; x++) {
      this._colLetters[x] = x2c(x);
    }

    // Expand range addresses (e.g. 'A1:C3') into individual cells.
    // Use __userKeys (set by buildInitialCells) to iterate only user-provided
    // addresses, avoiding an O(matrixCells) scan of the entire cells object.
    const addressKeys: string[] = (cells as any).__userKeys ?? Object.keys(cells);
    addressKeys.forEach((address) => {
      if (address === DEFAULT_KEY || address === DEFAULT_COL_KEY || address === DEFAULT_ROW_KEY) {
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

    // Store defaults for lazy cell resolution
    this._common = cells?.[DEFAULT_KEY];
    this._commonCol = cells?.[DEFAULT_COL_KEY];
    this._commonRow = cells?.[DEFAULT_ROW_KEY];
    this._initCells = cells;

    // Store deferred matrices for lazy cell value lookup
    const deferredMatrices = (cells as any).__matrices;
    if (deferredMatrices) {
      this._initMatrices = deferredMatrices;
      this._initFlattenAs = (cells as any).__flattenAs;
      this._matrixByBase = [];
      for (const baseAddress of Object.keys(deferredMatrices)) {
        const { y: baseY, x: baseX } = a2p(baseAddress);
        this._matrixByBase.push({ baseY, baseX, matrix: deferredMatrices[baseAddress] });
      }
    }
    if (this._commonCol?.width != null) {
      this.defaultColWidth = this._commonCol.width;
    }
    if (this._commonRow?.height != null) {
      this.defaultRowHeight = this._commonRow.height;
    }

    // Eagerly populate header row (y=0) and header column (x=0) only.
    // All data cells are lazily populated on first access.
    this._ensureIdRow(0);
    for (let x = 0; x <= auto.numCols; x++) {
      const id = this.idMatrix[0][x];
      this._ensureCellPopulated(0, x, id);
    }

    // Eagerly populate cells that have explicit data or formulas in the input.
    // This ensures formulas are identified for resolveFormulas().
    const explicitAddresses = addressKeys;
    for (const address of explicitAddresses) {
      if (address === DEFAULT_KEY || address === DEFAULT_COL_KEY || address === DEFAULT_ROW_KEY) {
        continue;
      }
      const point = a2p(address);
      const { y, x } = point;
      // Skip headers (already done), skip column/row-level defaults (like 'A' or '1')
      if ((y === 0 && x === 0) || y === 0 || x === 0) {
        continue;
      }
      // Skip column-only or row-only addresses (e.g. 'A' has x>0,y=0 or '1' has y>0,x=0)
      if (y <= 0 || x <= 0) {
        continue;
      }
      if (y > auto.numRows || x > auto.numCols) {
        continue;
      }
      const row = this._ensureIdRow(y);
      const id = row[x];
      if (id != null) {
        this._ensureCellPopulated(y, x, id);
      }
    }

    this.status = 1; // initialized
    this.registry.sheetIdsByName[this.name] = this.id;
  }

  /** @internal */
  private _incrementVersion() {
    this.version++;
    if (this.version >= Number.MAX_SAFE_INTEGER) {
      this.version = 1;
    }
  }

  /** @internal */
  private _xsheetDispatch(otherSheet: Sheet) {
    if (otherSheet === this) {
      return;
    }
    otherSheet.refresh(true);
    const context = this.registry.contextsBySheetId[otherSheet.id];
    if (context !== null) {
      const { dispatch } = context;
      requestAnimationFrame(() => {
        dispatch(this.registry.updateSheet(otherSheet));
      });
    }
  }

  /** @internal */
  private _generateId() {
    return (this.registry.cellHead++).toString();
  }

  /**
   * Lazily generate the ID row for the given y-coordinate.
   * If the row already exists, returns it immediately.
   * @internal
   */
  private _ensureIdRow(y: number): Ids {
    let row = this.idMatrix[y];
    if (row != null) {
      return row;
    }
    const numCols = this.area.right;
    row = [];
    for (let x = 0; x <= numCols; x++) {
      const id = this._generateId();
      row.push(id);
      const colLetter = this._colLetters[x] || x2c(x);
      this.addressCaches.set(id, y === 0 ? `${colLetter}0` : x === 0 ? `0${y}` : `${colLetter}${y}`);
    }
    this.idMatrix[y] = row;
    return row;
  }

  /**
   * Ensure that registry.data and registry.systems exist for a given cell.
   * Performs lazy cell stacking using stored initialization defaults.
   * @internal
   */
  private _ensureCellPopulated(y: number, x: number, id: Id): void {
    if (this.registry.data[id] != null) {
      return;
    }
    const cells = this._initCells;
    const changedTime = Date.now();
    let stacked: CellType;

    if (y === 0 && x > 0) {
      const colId = this._colLetters[x] || x2c(x);
      const colDefault = cells?.[colId];
      const { style: _cs, ...colDefaultLayout } = colDefault ?? {};
      const headerCell = cells?.[colId + '0'];
      stacked = {
        ...this._commonCol,
        ...colDefaultLayout,
        ...headerCell,
        ...Sheet._stack(this._commonCol, headerCell),
      } as CellType;
    } else if (x === 0 && y > 0) {
      const rowId = y2r(y);
      const rowDefault = cells?.[rowId];
      const { style: _rs, ...rowDefaultLayout } = rowDefault ?? {};
      const headerCell = cells?.['0' + rowId];
      stacked = {
        ...this._commonRow,
        ...rowDefaultLayout,
        ...headerCell,
        ...Sheet._stack(this._commonRow, headerCell),
      } as CellType;
    } else if (y === 0 && x === 0) {
      const cell = cells?.['0'];
      stacked = { ...cell, ...Sheet._stack(cell) } as CellType;
    } else {
      const colId = this._colLetters[x] || x2c(x);
      const rowId = y2r(y);
      const address = `${colId}${rowId}`;
      const rowDefault = cells?.[rowId];
      const colDefault = cells?.[colId];
      let cell = cells?.[address];
      // Resolve value from deferred matrices if cell has no explicit value
      if ((cell == null || !('value' in cell)) && this._matrixByBase.length > 0) {
        for (const { baseY, baseX, matrix } of this._matrixByBase) {
          const my = y - baseY;
          const mx = x - baseX;
          if (my >= 0 && my < matrix.length && mx >= 0 && mx < matrix[my].length) {
            const val = matrix[my][mx];
            let matrixCell: CellType;
            if (this._initFlattenAs) {
              matrixCell = { [this._initFlattenAs]: val };
            } else {
              matrixCell = val as CellType;
            }
            cell = cell ? { ...matrixCell, ...cell } : matrixCell;
            break;
          }
        }
      }
      stacked = {
        ...this._common,
        ...rowDefault,
        ...colDefault,
        ...cell,
        ...Sheet._stack(this._common, rowDefault, colDefault, cell),
      } as CellType;
    }

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
      // Track non-default row heights for arithmetic offset computation
      if (stacked.height !== (this.defaultRowHeight || DEFAULT_HEIGHT)) {
        this._rowHeightOverrides.set(y, stacked.height);
      }
      if (stacked.filtered) {
        this._filteredRows.add(y);
      }
    } else {
      delete stacked.height;
      delete stacked.width;
      delete stacked.label;
    }

    const policy = this.policies[stacked.policy ?? ''] ?? this.defaultPolicy;
    stacked = policy.deserializeValue(stacked.value, stacked) ?? {};
    this.registry.systems[id] = { id, changedTime, sheetId: this.id };
    this.registry.data[id] = stacked;
  }

  /**
   * Materialize all lazy ID rows. Call this before operations that need the full
   * idMatrix (e.g. .flat(), .map(), .slice() for sort/move/undo/redo).
   * @internal
   */
  private _materializeIdMatrix(): void {
    for (let y = 0; y < this.idMatrix.length; y++) {
      if (this.idMatrix[y] == null) {
        this._ensureIdRow(y);
      }
    }
  }

  /**
   * Compute the absolute top offset for a given row using arithmetic + overrides.
   * Avoids iterating all rows — O(overrides) instead of O(numRows).
   * @internal
   */
  public getOffsetTop(y: number): number {
    const headerH = this.headerHeight;
    const defaultH = this.defaultRowHeight || DEFAULT_HEIGHT;
    // Base offset assuming all rows have default height
    let offset = headerH + (y - 1) * defaultH;
    // Apply overrides for rows before y
    for (const [oy, h] of this._rowHeightOverrides) {
      if (oy < y) {
        offset += h - defaultH;
      }
    }
    // Subtract filtered rows before y
    for (const fy of this._filteredRows) {
      if (fy < y) {
        const h = this._rowHeightOverrides.get(fy) ?? defaultH;
        offset -= h;
      }
    }
    return offset;
  }

  public getRectSize({ top, left, bottom, right }: AreaType): RectType {
    const l = left || 1;
    const t = top || 1;

    // Column offsets: read from pre-computed offsetLeft on header cells
    const rw = this.registry.systems[this.getId({ y: 0, x: right })]?.offsetLeft ?? 0;
    const lw = this.registry.systems[this.getId({ y: 0, x: l })]?.offsetLeft ?? 0;
    // Row offsets: compute arithmetically
    const rh = this.getOffsetTop(bottom);
    const th = this.getOffsetTop(t);

    const width = Math.max(0, rw - lw);
    const height = Math.max(0, rh - th);
    return { y: t, x: l, height, width };
  }

  /** @internal */
  public setTotalSize() {
    const numCols = this.numCols;
    const numRows = this.numRows;
    const headerW = this.headerWidth;
    const headerH = this.headerHeight;
    const defaultH = this.defaultRowHeight || DEFAULT_HEIGHT;

    // Write offsetLeft into column-header cells (y=0, x=1..numCols) — small loop
    let accW = 0;
    for (let x = 1; x <= numCols; x++) {
      const cell = this.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
      const w = cell?.width || this.defaultColWidth || DEFAULT_WIDTH;
      const colSys = this.registry.systems[this.getId({ y: 0, x })];
      if (colSys != null) {
        colSys.offsetLeft = headerW + accW;
      }
      accW += w;
    }
    this.totalWidth = headerW + accW;

    // Compute totalHeight arithmetically — O(overrides) instead of O(numRows)
    let totalOverrideDiff = 0;
    let filteredHeightSum = 0;
    for (const [y, h] of this._rowHeightOverrides) {
      if (y >= 1 && y <= numRows) {
        totalOverrideDiff += h - defaultH;
      }
    }
    for (const fy of this._filteredRows) {
      if (fy >= 1 && fy <= numRows) {
        const h = this._rowHeightOverrides.get(fy) ?? defaultH;
        filteredHeightSum += h;
      }
    }
    const fullH = numRows * defaultH + totalOverrideDiff;
    this.totalHeight = headerH + fullH - filteredHeightSum;
    this.fullHeight = headerH + fullH;
  }

  /** @internal */
  public refresh(relocate = false, resize = false): Sheet {
    this._incrementVersion();
    this.lastChangedTime = this.changedTime;
    this.changedTime = Date.now();

    this.clearSolvedCaches();
    // Reset strip cache. Normally unnecessary since child Sheets in solvedCaches
    // are discarded above, but defensive against stale references.
    this._stripped = NONE;

    if (relocate) {
      // force reset
      this.addressCaches.clear();
    }
    if (resize) {
      this.setTotalSize();
    }
    return this;
  }

  /** @internal */
  public clone(relocate = false): Sheet {
    const copied: Sheet = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    copied._stripped = NONE;
    return copied.refresh(relocate);
  }

  /** @internal */
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

    this._materializeIdMatrix();
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

  /** @internal */
  public getAddressById(id: Id, slideY = 0, slideX = 0): string | undefined {
    const { y, x, absCol, absRow } = this.getPointById(id, slideY, slideX);
    return grantAddressAbsolute(p2a({ y, x }), absCol, absRow);
  }

  /** @internal */
  public clearAddressCaches() {
    this.addressCaches.clear();
  }

  /** @internal */
  private _warmAddressCaches() {
    this._materializeIdMatrix();
    for (let y = 0; y < this.idMatrix.length; y++) {
      const row = this.idMatrix[y];
      for (let x = 0; x < row.length; x++) {
        this.addressCaches.set(row[x], p2a({ y, x }));
      }
    }
  }

  /** @internal */
  public getId(point: PointType) {
    const { y, x } = point;
    if (y >= 0 && x >= 0 && y <= this.area.bottom && x <= this.area.right) {
      return this._ensureIdRow(y)[x];
    }
    // Out-of-bounds: return from raw array (undefined at runtime, preserves original type)
    return this.idMatrix[y]?.[x];
  }

  /** @internal */
  public getCell(point: PointType, { resolution = 'RESOLVED', raise = false }: SolveOptions = {}) {
    const { y, x } = point;
    if (y === -1 || x === -1) {
      return undefined;
    }
    const id = this.getId(point);
    if (id == null) {
      return undefined;
    }
    // Lazy cell population
    this._ensureCellPopulated(y, x, id);
    const cell = this.registry.data[id];
    if (cell == null) {
      return undefined;
    }
    let value = cell.value;
    if (resolution !== 'SYSTEM' && (cell.formulaEnabled ?? true)) {
      value = solveFormula({ value, sheet: this, point, raise, resolution, at: id });
    }
    return { ...cell, value } as CellType;
  }

  /** @internal */
  public get numRows() {
    const { top, bottom } = this.area;
    return 1 + bottom - top;
  }

  public get numCols() {
    const { left, right } = this.area;
    return 1 + right - left;
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

  /** @internal */
  public _toValueMatrix({
    area,
    at,
    resolution = 'RESOLVED',
    raise = false,
    filter = noFilter,
    asScalar = false,
  }: InternalToValueMatrixProps = {}) {
    const { top, left, bottom, right } = area ?? this.area;
    const matrix = createMatrix(bottom - top + 1, right - left + 1);

    // Normalize `at` check to ensure we only throw circular ref if the `at` is from this sheet
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const id = this.getId({ y, x });
        if (at === id) {
          throw new FormulaError('#REF!', 'References are circulating.');
        }
        const cell = this.getCell({ y, x }, { resolution, raise }) ?? {};
        if (filter(cell)) {
          let fieldValue = cell.value;
          if (asScalar) {
            const policy = this.getPolicy({ y, x });
            fieldValue = policy.toScalar({ value: cell.value, cell, sheet: this, point: { y, x } });
          }
          matrix[y - top][x - left] = fieldValue;
        }
      }
    }
    return matrix;
  }

  /** @internal */
  private _pushHistory(history: HistoryType) {
    const book = this.registry;
    const strayedHistories = book.histories.splice(book.historyIndex + 1, book.histories.length);
    strayedHistories.forEach(this._cleanStrayed.bind(this));
    book.histories.push(history);
    book.lastHistory = book.currentHistory = history;
    if (book.histories.length > book.historyLimit) {
      const kickedOut = book.histories.splice(0, 1)[0];
      this._cleanObsolete(kickedOut);
    } else {
      book.historyIndex++;
    }
  }

  /** @internal */
  private _cleanObsolete(history: HistoryType) {
    if (history.operation === 'REMOVE_ROWS' || history.operation === 'REMOVE_COLS') {
      history.deleted.forEach((ids) => {
        ids.forEach((id) => {
          this._deleteOrphanedId(id);
        });
      });
    }
    if (history.operation === 'MOVE') {
      history.moveRelations.forEach((rel) => {
        if (rel.new != null) {
          this._deleteOrphanedId(rel.new);
        }
        if (rel.lost != null) {
          this._deleteOrphanedId(rel.lost);
        }
      });
    }
  }

  /** @internal */
  private _cleanStrayed(history: HistoryType) {
    /**
     * Cleans up IDs that were created by a history entry that has been discarded
     * ("strayed") due to a new operation being pushed while the history index was
     * not at the end (i.e. after undo).
     *
     * When the user undoes one or more steps and then performs a new operation,
     * the previously-redoable future histories are removed from the history stack.
     * Any cells that were **inserted** by those discarded histories (INSERT_ROWS /
     * INSERT_COLS) have IDs that are no longer reachable from the id-matrix, so
     * their registry entries must be deleted to avoid memory leaks.
     * @internal
     */
    if (history.operation === 'INSERT_ROWS' || history.operation === 'INSERT_COLS') {
      history.idMatrix.forEach((ids) => {
        ids.forEach((id) => {
          this._deleteOrphanedId(id);
        });
      });
    }
  }

  /**
   * Remove an id from registry.data and registry.dependents entirely.
   * @internal
   */
  private _deleteOrphanedId(id: Id) {
    const sys = this.registry.systems[id];
    sys?.dependencies?.forEach((depId) => {
      this.registry.systems[depId]?.dependents?.delete(id);
    });
    delete this.registry.data[id];
    delete this.registry.systems[id];
  }

  /** @internal */
  private _copyCellLayout(cell: CellType | undefined) {
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

    this._xsheetDispatch(srcSheetRaw);

    if (historicize) {
      this._pushHistory({
        applyed: true,
        operation: 'MOVE',
        srcSheetId: srcSheetRaw.id,
        dstSheetId: this.id,
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
  /** @internal */
  private _createMoveRelations(srcSheet: Sheet, src: AreaType, dstSheet: Sheet, dst: AreaType): MoveRelations {
    const { top: srcTop, left: srcLeft, bottom: srcBottom, right: srcRight } = src;
    const { top: dstTop, left: dstLeft } = dst;

    const dstNumRows = dstSheet.numRows;
    const dstNumCols = dstSheet.numCols;

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
          newId = srcSheet._generateId();
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

        const srcCell = srcSheet.getCell({ y: srcY, x: srcX }, { resolution: 'SYSTEM' });
        const dstCell = isDstInBounds ? dstSheet.getCell({ y: dstY, x: dstX }, { resolution: 'SYSTEM' }) : undefined;

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
  /** @internal */
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

        const srcCell = srcId != null ? srcSheet.registry.data[srcId] : undefined;
        const dstCell = dstId != null ? dstSheet.registry.data[dstId] : undefined;

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
          };
          this.registry.systems[newId] = { id: newId, sheetId: srcSheet.id, changedTime: Date.now() };
          idWritesSrc.push({ y: srcPoint.y, x: srcPoint.x, id: newId });
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
            diffBefore[srcId] = srcCell ?? {};
            wireWrites[srcId] = {
              ...srcCell,
              ...restricted,
              policy: isSrcWinner ? beforePolicy : afterPolicy,
            };
          }
          if (srcCell != null) {
            const srcSys = this.registry.systems[srcId];
            if (srcSys) {
              srcSys.changedTime = Date.now();
            }
          }

          idWritesDst.push({ y: dstPoint.y, x: dstPoint.x, id: srcId });
        }
      }
    } else {
      // Reverse pass: collect id buffer writes (no registry.data modification)
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

    // Snapshot idMatrix before flush
    if (!reverse) {
      srcSheet._materializeIdMatrix();
      if (srcSheet !== dstSheet) {
        dstSheet._materializeIdMatrix();
      }
    }
    const srcSnapshot = !reverse ? srcSheet.idMatrix.flat() : null;
    const dstSnapshot = !reverse && srcSheet !== dstSheet ? dstSheet.idMatrix.flat() : null;

    // Flush registry.data writes first
    Object.assign(this.registry.data, wireWrites);
    // Then flush idMatrix writes
    for (const { y, x, id } of idWritesSrc) {
      srcSheet._ensureIdRow(y)[x] = id;
    }
    for (const { y, x, id } of idWritesDst) {
      dstSheet._ensureIdRow(y)[x] = id;
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
      preserver.buildMap(srcSnapshot!.flat(), srcSheet.idMatrix.flat());
      if (srcSheet !== dstSheet) {
        preserver.buildMap(dstSnapshot!.flat(), dstSheet.idMatrix.flat());
      }
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
      if (y > this.numRows) {
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
        if (toX > this.numCols) {
          continue;
        }
        const fromX = leftFrom + (j % srcNumCols);
        const slideY = isXSheet ? 0 : toY - fromY;
        const slideX = isXSheet ? 0 : toX - fromX;
        const cell: CellType = {
          ...srcSheet.getCell({ y: fromY, x: fromX }, { resolution: 'SYSTEM' }),
        };
        const dstPoint = { y: toY, x: toX };
        const dstCell = this.getCell(dstPoint, { resolution: 'SYSTEM' });
        const dstPolicy = this.getPolicy(dstPoint);
        const srcPoint = { y: fromY, x: fromX };
        const srcPolicy = srcSheet.getPolicy(srcPoint);
        const srcCell = srcSheet.getCell(srcPoint, { resolution: 'SYSTEM' });

        const isSrcWinner = srcPolicy.priority > dstPolicy.priority;
        cell.policy = isSrcWinner ? srcCell?.policy : dstCell?.policy;
        const dstIdForClear = this.getId(dstPoint);
        this.clearDependencies(dstIdForClear);
        const value =
          (cell?.formulaEnabled ?? true)
            ? this.processFormula(cell?.value, {
                dependency: dstIdForClear,
                slideY,
                slideX,
              })
            : cell?.value;
        const dstId = this.getId(dstPoint);
        const dstSys = this.registry.systems[dstId];
        if (dstSys != null) {
          dstSys.changedTime = changedTime;
        }
        const address = p2a(dstPoint);
        if (onlyValue) {
          const dstCell = this.getCell(dstPoint, { resolution: 'SYSTEM' });
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

  public getPolicy(point: PointType): PolicyType {
    const cell = this.getCell(point, { resolution: 'SYSTEM' });
    if (cell?.policy == null) {
      return this.defaultPolicy;
    }
    return this.policies[cell.policy] ?? this.defaultPolicy;
  }

  /** @internal */
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
      const current = this.registry.data[id];
      if (operator === 'USER' && operation.hasOperation(current?.prevention, operation.Update)) {
        return;
      }

      let next: Record<string, any> = { ...diff[address] };

      if (formulaIdentify && 'value' in next) {
        const formulaEnabled = next.formulaEnabled ?? current?.formulaEnabled ?? true;
        if (formulaEnabled) {
          this.clearDependencies(id);
          next.value = this.processFormula(next.value, { dependency: id });
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
      if (next.width != null || next.height != null) {
        resized = true;
      }
      diffBefore[id] = current ?? {};

      const policy = this.policies[current?.policy || DEFAULT_POLICY_NAME] ?? this.defaultPolicy;
      const p = policy.select({
        sheet: this,
        point,
        next,
        current,
        operation: op,
      });
      next = { ...p };
      if (updateChangedTime) {
        const sys = this.registry.systems[id];
        if (sys != null) {
          sys.changedTime = changedTime;
        }
      }
      if (partial) {
        const merged = { ...current, ...next };
        this.registry.data[id] = merged;
        diffAfter[id] = merged;
      } else {
        this.registry.data[id] = next;
        diffAfter[id] = next;
      }
      changedAddresses.push(address);
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
      this._pushHistory({
        applyed: true,
        operation: 'UPDATE',
        srcSheetId: this.id,
        dstSheetId: this.id,
        undoReflection,
        redoReflection,
        diffBefore,
        diffAfter,
        partial,
      });
    }
    return this.refresh(false, resized);
  }

  /** @internal */
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
          const currentCell = this.getCell(dstPoint, { resolution: 'SYSTEM' });
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
    const current = this.getCell(point, { resolution: 'RAW' });
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
    if (this.maxNumRows !== -1 && this.numRows + numRows > this.maxNumRows) {
      console.error(`Rows are limited to ${this.maxNumRows}.`);
      return this;
    }
    const numCols = this.numCols;
    const rows: IdMatrix = [];
    const changedTime = Date.now();
    for (let i = 0; i < numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j <= numCols; j++) {
        const id = this._generateId();
        row.push(id);
        const cell = this.getCell({ y: baseY, x: j }, { resolution: 'SYSTEM' });
        const copied = this._copyCellLayout(cell);
        this.registry.data[id] = { ...copied };
        this.registry.systems[id] = { id, sheetId: this.id, changedTime };
      }
      rows.push(row);
    }
    this.idMatrix.splice(y, 0, ...rows);
    this.area.bottom += numRows;

    this._pushHistory({
      applyed: true,
      operation: 'INSERT_ROWS',
      srcSheetId: this.id,
      dstSheetId: this.id,
      undoReflection,
      redoReflection,
      y,
      numRows,
      idMatrix: rows,
    });

    // If diff is provided, update the cells after insertion
    if (diff) {
      Object.assign(this.registry.lastHistory!, this._update({ diff, partial, updateChangedTime, operator }), {
        partial,
      });
    }
    if (this.registry.onInsertRows) {
      const cloned = this.clone();
      cloned.area = {
        top: y,
        bottom: y + numRows - 1,
        left: this.area.left,
        right: this.area.right,
      };
      cloned.addressCaches = new Map();
      this.registry.onInsertRows({ sheet: cloned, y, numRows });
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
    if (this.minNumRows !== -1 && this.numRows - numRows < this.minNumRows) {
      console.error(`At least ${this.minNumRows} row(s) are required.`);
      return this;
    }

    const preserver = new ReferencePreserver(this);
    const ys: number[] = [];
    this._materializeIdMatrix();
    const backup = this.idMatrix.map((ids) => [...ids]); // backup before deletion

    for (let yi = y; yi < y + numRows; yi++) {
      const cell = this.getCell({ y: yi, x: 0 }, { resolution: 'SYSTEM' });
      if (operator === 'USER' && operation.hasOperation(cell?.prevention, operation.RemoveRows)) {
        console.warn(`Cannot delete row ${yi}.`);
        return this;
      }
      for (let xi = 1; xi <= this.numCols; xi++) {
        const id = this.getId({ y: yi, x: xi });
        if (id == null) {
          continue;
        }
        preserver.collectDependents(id);
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

    this._pushHistory({
      applyed: true,
      operation: 'REMOVE_ROWS',
      srcSheetId: this.id,
      dstSheetId: this.id,
      undoReflection,
      redoReflection,
      ys: ys.reverse(),
      diffBefore,
      deleted,
    });

    if (this.registry.onRemoveRows) {
      const cloned = this.clone();
      cloned.idMatrix = backup;
      cloned.area = {
        top: y,
        bottom: y + numRows - 1,
        left: this.area.left,
        right: this.area.right,
      };
      cloned.addressCaches = new Map();
      this.registry.onRemoveRows({ sheet: cloned, ys: ys.reverse() });
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
    if (this.maxNumCols !== -1 && this.numCols + numCols > this.maxNumCols) {
      console.error(`Columns are limited to ${this.maxNumCols}.`);
      return this;
    }
    const numRows = this.numRows;
    const rows: IdMatrix = [];
    const changedTime = Date.now();
    for (let i = 0; i <= numRows; i++) {
      const row: Ids = [];
      for (let j = 0; j < numCols; j++) {
        const id = this._generateId();
        row.push(id);
        const cell = this.getCell({ y: i, x: baseX }, { resolution: 'SYSTEM' });
        const copied = this._copyCellLayout(cell);
        this._ensureIdRow(i).splice(x, 0, id);
        this.registry.data[id] = { ...copied };
        this.registry.systems[id] = { id, sheetId: this.id, changedTime };
      }
      rows.push(row);
    }
    this.area.right += numCols;

    this._pushHistory({
      applyed: true,
      operation: 'INSERT_COLS',
      srcSheetId: this.id,
      dstSheetId: this.id,
      undoReflection: undoReflection,
      redoReflection: redoReflection,
      x,
      numCols,
      idMatrix: rows,
    });

    // If diff is provided, update the cells after insertion
    if (diff) {
      Object.assign(this.registry.lastHistory!, this._update({ diff, partial, updateChangedTime, operator }), {
        partial,
      });
    }
    if (this.registry.onInsertCols) {
      const cloned = this.clone();
      cloned.area = {
        top: this.area.top,
        bottom: this.area.bottom,
        left: x,
        right: x + numCols - 1,
      };
      cloned.addressCaches = new Map();
      this.registry.onInsertCols({ sheet: cloned, x, numCols });
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
    if (this.minNumCols !== -1 && this.numCols - numCols < this.minNumCols) {
      console.error(`At least ${this.minNumCols} column(s) are required.`);
      return this;
    }

    const preserver = new ReferencePreserver(this);
    const xs: number[] = [];
    this._materializeIdMatrix();
    const backup = this.idMatrix.map((ids) => [...ids]); // backup before deletion

    for (let xi = x; xi < x + numCols; xi++) {
      const cell = this.getCell({ y: 0, x: xi }, { resolution: 'SYSTEM' });
      if (operator === 'USER' && operation.hasOperation(cell?.prevention, operation.RemoveCols)) {
        console.warn(`Cannot delete col ${xi}.`);
        continue;
      }
      for (let yi = 1; yi <= this.numRows; yi++) {
        const id = this.getId({ y: yi, x: xi });
        if (id == null) {
          continue;
        }
        preserver.collectDependents(id);
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

    this._pushHistory({
      applyed: true,
      operation: 'REMOVE_COLS',
      srcSheetId: this.id,
      dstSheetId: this.id,
      undoReflection: undoReflection,
      redoReflection: redoReflection,
      xs: xs.reverse(),
      diffBefore,
      deleted,
    });

    if (this.registry.onRemoveCols) {
      const cloned = this.clone();
      cloned.idMatrix = backup;
      cloned.area = {
        top: this.area.top,
        bottom: this.area.bottom,
        left: x,
        right: x + numCols - 1,
      };
      cloned.addressCaches = new Map();
      this.registry.onRemoveCols({ sheet: cloned, xs: xs.reverse() });
    }
    return this.refresh(true, true);
  }
  /** @internal */
  public histories() {
    return [...this.registry.histories];
  }
  /** @internal */
  public historyIndex() {
    return this.registry.historyIndex;
  }
  /** @internal */
  public historySize() {
    return this.registry.histories.length;
  }
  /** @internal */
  public getHistoryLimit() {
    return this.registry.historyLimit;
  }

  /** @internal */
  public parse(point: PointType, value: any): CellType {
    const cell = this.getCell(point, { resolution: 'SYSTEM' }) ?? {};
    const policy = this.getPolicy(point);
    return policy.deserializeValue(value, cell);
  }

  /** @internal */
  public render(props: RenderProps) {
    const { point, apply } = props;
    const at = this.getId(point);
    const policy = this.getPolicy(point);
    return policy.render({ sheet: this, point, apply, value: undefined });
  }

  public getSerializedValue({
    point,
    cell,
    resolution = 'RESOLVED',
  }: {
    point: PointType;
    cell?: CellType;
    resolution?: Resolution;
  }) {
    if (cell == null) {
      // Use raw cell from registry so cell.value is the original formula string.
      // getCell(raise=false) would replace cell.value with undefined, losing the formula.
      const id = this.getId(point);
      cell = id != null ? this.registry.data[id] : undefined;
    }
    if (cell == null) {
      return '';
    }
    const policy = this.getPolicy(point);
    const raw = cell.value;

    if (typeof raw === 'string' && raw[0] === '=') {
      if (resolution === 'SYSTEM') {
        return raw; // do not evaluate system references
      }
      if (resolution === 'RAW' || cell?.formulaEnabled === false) {
        const lexer = new Lexer(raw.substring(1));
        lexer.tokenize();
        return '=' + lexer.display({ sheet: this });
      }
      try {
        const id = this.getId(point);
        const solved = solveFormula({ value: raw, sheet: this, point, raise: true, resolution, at: id });
        const value = stripSheet({ value: solved, raise: false });
        return policy.serialize({ value, cell, sheet: this, point });
      } catch (e) {
        return policy.serialize({ value: e, cell, sheet: this, point });
      }
    }
    return policy.serialize({ value: raw, cell, sheet: this, point });
  }

  /** @internal */
  public trim(area: AreaType): Sheet {
    const copied: Sheet = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    copied.area = area;
    copied._stripped = NONE;
    return copied;
  }

  /**
   * Solve all formulas in this sheet and return a 2D matrix of resolved values.
   * @internal
   */
  public solve({ raise = false, at }: { raise?: boolean; at: Id }): any[][] {
    return solveSheet({ sheet: this, raise, at });
  }

  /**
   * Collapse this sheet to a scalar (top-left cell value).
   * @internal
   */
  public strip({ raise = false, at }: { raise?: boolean; at?: Id }): any {
    if (!NONE.is(this._stripped)) {
      return this._stripped;
    }
    let value: any = this;
    while (value instanceof Sheet) {
      value = solveSheet({ sheet: value, raise, at })[0]?.[0];
    }
    this._stripped = value;
    return this._stripped;
  }

  /** @internal */
  private _applyDiff(diff: CellsByIdType = {}, partial = true) {
    const ids = Object.keys(diff);
    ids.forEach((id) => {
      const cell = diff[id] ?? {};
      let merged: CellType;
      if (partial) {
        merged = { ...this.registry.data[id] };
        (Object.keys(cell) as (keyof CellType)[]).forEach((key) => {
          if (cell[key] === undefined) {
            delete merged[key];
          } else {
            (merged as any)[key] = cell[key];
          }
        });
      } else {
        merged = { ...cell };
      }
      const sys = this.registry.systems[id];
      if (sys != null) {
        sys.changedTime = Date.now();
      }
      this.registry.data[id] = merged;
      this.clearDependencies(id);
      this.processFormula(merged.value, { dependency: id });

      // Track row height overrides and filtered state
      const address = this.addressCaches.get(id);
      if (address) {
        const p = a2p(address);
        if (p.x === 0 && p.y > 0) {
          const defaultH = this.defaultRowHeight || DEFAULT_HEIGHT;
          const h = merged.height ?? defaultH;
          if (h !== defaultH) {
            this._rowHeightOverrides.set(p.y, h);
          } else {
            this._rowHeightOverrides.delete(p.y);
          }
          if (merged.filtered) {
            this._filteredRows.add(p.y);
          } else {
            this._filteredRows.delete(p.y);
          }
        }
      }
    });
    this._warmAddressCaches();
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
    if (this.registry.historyIndex < 0) {
      return { history: null, newSheet: this.__raw__ };
    }
    const history = this.registry.histories[this.registry.historyIndex--];
    history.applyed = false;
    this.registry.currentHistory = this.registry.histories[this.registry.historyIndex];

    const srcSheet = this.getSheetBySheetId(history.srcSheetId);
    const dstSheet = this.getSheetBySheetId(history.dstSheetId);

    if (!dstSheet) {
      return { history: null, newSheet: this.__raw__ };
    }

    switch (history.operation) {
      case 'UPDATE':
        dstSheet._applyDiff(history.diffBefore, history.partial ?? false);
        break;
      case 'INSERT_ROWS': {
        if (history.diffBefore) {
          dstSheet._applyDiff(history.diffBefore, false);
        }
        const { rows } = matrixShape({ matrix: history.idMatrix });
        dstSheet._materializeIdMatrix();
        dstSheet.idMatrix.splice(history.y, rows);
        dstSheet.area.bottom -= rows;
        break;
      }
      case 'INSERT_COLS': {
        if (history.diffBefore) {
          dstSheet._applyDiff(history.diffBefore, false);
        }
        const { cols } = matrixShape({ matrix: history.idMatrix });
        dstSheet._materializeIdMatrix();
        dstSheet.idMatrix.forEach((row: string[]) => {
          row.splice(history.x, cols);
        });
        dstSheet.area.right -= cols;
        break;
      }
      case 'REMOVE_ROWS': {
        const { ys, deleted } = history;
        dstSheet._materializeIdMatrix();
        ys.forEach((y, i) => {
          dstSheet.idMatrix.splice(y, 0, deleted[i]);
        });
        dstSheet.area.bottom += ys.length;
        this._applyDiff(history.diffBefore, false);
        break;
      }
      case 'REMOVE_COLS': {
        const { xs, deleted } = history;
        dstSheet._materializeIdMatrix();
        dstSheet.idMatrix.forEach((row: string[], i: number) => {
          for (let j = 0; j < xs.length; j++) {
            row.splice(xs[j], 0, deleted[i][j]);
          }
        });
        dstSheet.area.right += xs.length;
        this._applyDiff(history.diffBefore, false);
        break;
      }
      case 'MOVE': {
        if (srcSheet) {
          this._moveCells(srcSheet, dstSheet, history.moveRelations, true);
        }
        const movedAddresses = dstSheet.lastChangedAddresses;
        dstSheet._applyDiff(history.diffBefore, false);
        dstSheet.lastChangedAddresses = [...new Set([...movedAddresses, ...dstSheet.lastChangedAddresses])];
        break;
      }
      case 'SORT_ROWS': {
        dstSheet._materializeIdMatrix();
        const snapshotIds = dstSheet.idMatrix.flat();
        dstSheet._sortRowMapping(history.sortedRowMapping, true);
        const preserver = new ReferencePreserver(dstSheet);
        preserver.buildMap(snapshotIds, dstSheet.idMatrix.flat());
        preserver.resolveDependents();
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
      this._xsheetDispatch(srcSheet);
    }
    return {
      history,
      callback: ({ sheetReactive: sheetRef }: { sheetReactive: RefLike<Sheet> }) => {
        sheetRef.current?.registry.transmit(history.undoReflection?.transmit);
      },
    };
  }

  public redo() {
    if (this.registry.historyIndex + 1 >= this.registry.histories.length) {
      return { history: null, newSheet: this.__raw__ };
    }
    const history = this.registry.histories[++this.registry.historyIndex];
    history.applyed = true;
    this.registry.currentHistory = history;

    const srcSheet = this.getSheetBySheetId(history.srcSheetId);
    const dstSheet = this.getSheetBySheetId(history.dstSheetId);

    if (!dstSheet) {
      return { history: null, newSheet: this.__raw__ };
    }

    switch (history.operation) {
      case 'UPDATE':
        dstSheet._applyDiff(history.diffAfter, history.partial ?? false);
        break;
      case 'INSERT_ROWS': {
        if (history.diffAfter) {
          dstSheet._applyDiff(history.diffAfter, false);
        }
        const { rows } = matrixShape({ matrix: history.idMatrix });
        dstSheet._materializeIdMatrix();
        dstSheet.idMatrix.splice(history.y, 0, ...history.idMatrix);
        dstSheet.area.bottom += rows;
        break;
      }
      case 'INSERT_COLS': {
        if (history.diffAfter) {
          dstSheet._applyDiff(history.diffAfter, false);
        }
        const { cols } = matrixShape({ matrix: history.idMatrix });
        dstSheet._materializeIdMatrix();
        dstSheet.idMatrix.map((row: string[], i: number) => {
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
        dstSheet._materializeIdMatrix();
        const snapshotIds = dstSheet.idMatrix.flat();
        dstSheet._sortRowMapping(history.sortedRowMapping, false);
        const preserver = new ReferencePreserver(dstSheet);
        preserver.buildMap(snapshotIds, dstSheet.idMatrix.flat());
        preserver.resolveDependents();
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
      this._xsheetDispatch(srcSheet);
    }
    return {
      history,
      callback: ({ sheetReactive: sheetRef }: { sheetReactive: RefLike<Sheet> }) => {
        sheetRef.current?.registry.transmit(history.redoReflection?.transmit);
      },
    };
  }
  /** @internal */
  public getFunctionByName(name: string) {
    return this.registry.functions[name];
  }

  /** @internal */
  public clearDependencies(id: Id): void {
    const sys = this.registry.systems[id];
    sys?.dependencies?.forEach((depId) => {
      this.registry.systems[depId]?.dependents?.delete(id);
    });
    if (sys != null) {
      sys.dependencies = new Set();
    }
  }

  /** @internal */
  public addDependency(id: Id, dependency: Id): void {
    const sys = ensureSys(this.registry, id);
    if (sys.dependents == null) {
      sys.dependents = new Set();
    }
    sys.dependents.add(dependency);
    const depSys = ensureSys(this.registry, dependency);
    if (depSys.dependencies == null) {
      depSys.dependencies = new Set();
    }
    depSys.dependencies.add(id);
  }

  /** @internal */
  public getSolvedCache(point: PointType): [boolean, any] {
    const id = this.getId(point);
    return [this.registry.solvedCaches.has(id), this.registry.solvedCaches.get(id)];
  }
  /** @internal */
  public setSolvingCache(point: PointType) {
    const id = this.getId(point);
    this.registry.solvedCaches.set(id, SOLVING);
    ensureSys(this.registry, id, { tmpAsyncCaches: {} });
  }

  /** @internal */
  public finishSolvedCache(point: PointType, value: any) {
    if (SOLVING.is(value)) {
      return;
    }

    const id = this.getId(point);
    this.registry.solvedCaches.set(id, value);

    const cell = this.registry.data[id];
    if (cell == null) {
      return;
    }
    const sys = this.registry.systems[id];
    const tmp = sys?.tmpAsyncCaches;

    if (tmp != null) {
      if (Object.keys(tmp).length > 0) {
        cell.asyncCaches = tmp;
      } else {
        delete cell.asyncCaches;
      }
      delete sys!.tmpAsyncCaches;
    }
  }

  /** @internal */
  public clearSolvedCaches() {
    this.registry.solvedCaches.clear();
    for (const id of this.registry.lastSpilledTargetIds) {
      const sys = this.registry.systems[id];
      if (sys?.spilledFrom != null) {
        delete sys.spilledFrom;
      }
    }
    this.registry.lastSpilledTargetIds.clear();
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
   * @internal
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
        const targetCell = this.registry.data[targetId];
        if (targetCell?.value != null && targetCell.value !== '') {
          throw new FormulaError(
            '#REF!',
            `Array result was not expanded because it would overwrite data in ${address}.`,
          );
        }
        // If solvedCaches already has an entry for this cell, another formula
        // (including another spill) has already written here — treat as obstruction.
        if (this.registry.solvedCaches.has(targetId)) {
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
            const targetCell = this.registry.data[targetId];
            if (targetCell != null) {
              const sys = ensureSys(this.registry, targetId, {});
              sys.spilledFrom = p2a(origin);
              this.registry.lastSpilledTargetIds.add(targetId);
            }
          }
        }
      }
    }

    return matrix[0][0];
  }

  /** @internal */
  public sheetPrefix(omit = false) {
    if (omit) {
      return '';
    }
    return toSheetPrefix(this.name);
  }
  /** @internal */
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
    return areaShape(this.area);
  }
  get hasSingleCell() {
    const shape = this.shape;
    return shape.rows === 1 && shape.cols === 1;
  }
  get currentVersion() {
    return this.version;
  }
}
