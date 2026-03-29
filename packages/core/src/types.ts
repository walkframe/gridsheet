import type { UserSheet, Sheet, SheetLimits } from './lib/sheet';

/**
 * Framework-agnostic CSS properties type.
 * React-core / Preact-core can narrow this to their own CSSProperties if needed.
 */
export type CSSPropertiesLike = { [key: string]: any };

/**
 * Framework-agnostic ref-like type (equivalent to React.RefObject).
 */
export type RefLike<T> = { current: T | null };

/**
 * Controls how formula values are resolved when reading a cell.
 *
 * - `'RESOLVED'` (default) — Fully evaluates formulas to a scalar value.
 *   Range references (e.g. `=C1:F1`) are unwrapped to the top-left scalar.
 * - `'EVALUATED'` — Evaluates formulas one level deep but keeps range/Sheet
 *   results intact. Use this when you need the `Sheet` object a range formula
 *   produces (e.g. in `renderSheet` policy hooks).
 * - `'RAW'` — Returns the formula string with cell addresses resolved to their
 *   display form; does not evaluate.
 * - `'SYSTEM'` — Returns the raw stored value with no evaluation or transformation.
 */
export type Resolution = 'RESOLVED' | 'EVALUATED' | 'RAW' | 'SYSTEM';

export type Y = number;
export type X = number;

export type Height = number;
export type Width = number;

export type ShapeType = { rows: number; cols: number };

export type RectType = { y: Y; x: X; height: Height; width: Width };

export type MatrixType<T = any> = T[][];

export type CursorStateType = {
  pointing: PointType;
  selectingFrom: PointType;
  selectingTo: PointType;
};

export type FeedbackType = (args: { sheet: UserSheet; points?: CursorStateType }) => void;

export type ModeType = 'light' | 'dark';
export type HeadersType = 'both' | 'vertical' | 'horizontal' | 'none';

export type AsyncCache = {
  /** Cached result value from the async computation. */
  value: any;
  /** Absolute timestamp (ms since epoch) at which the cache expires. undefined means cache never expires. */
  expireTime?: number;
};

export type System = {
  id?: string;
  sheetId?: number;
  changedTime?: number;
  /** Cumulative top offset (px) from sheet origin. Set on row-header cells (x=0). */
  offsetTop?: number;
  /** Cumulative left offset (px) from sheet origin. Set on col-header cells (y=0). */
  offsetLeft?: number;
  tmpAsyncCaches?: Record<string, AsyncCache>;
  /** Address of the origin cell whose array formula spilled its value into this cell. */
  spilledFrom?: Address;
  /** IDs of cells whose formula depends on this cell. */
  dependents?: Set<Id>;
  /** IDs of cells that this cell's formula depends on. */
  dependencies?: Set<Id>;
};

export type FilterConditionMethod =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'blank'
  | 'nonblank'
  | 'includes'
  | 'excludes';

export type FilterCondition = {
  method: FilterConditionMethod;
  value: string[];
};

export type FilterConfig = {
  mode?: 'and' | 'or'; // default: 'or'
  conditions: FilterCondition[];
};

export type CellType<T = any, Custom = any> = {
  value?: T;
  style?: CSSPropertiesLike;
  justifyContent?: string;
  alignItems?: string;
  label?: string;
  width?: Width;
  height?: Height;
  policy?: string;
  custom?: Custom;
  formulaEnabled?: boolean;
  prevention?: OperationType;
  /** Cached result from an async formula. Stored directly on the cell for serializability. */
  asyncCaches?: Record<string, AsyncCache>;
  /** Filter configuration. Set on col-header cells (y=0). null means explicitly absent (used in undo diffBefore to survive JSON serialization). */
  filter?: FilterConfig | null;
  /** Whether this row is hidden by a filter. Set on row-header cells (x=0). */
  filtered?: boolean;
  /** If true, this row is excluded from sort and stays at its original position. Set on row-header cells (x=0). */
  sortFixed?: boolean;
  /** If true, this row is always visible regardless of active filters. Set on row-header cells (x=0). */
  filterFixed?: boolean;
};

export type RawCellType = {
  value?: string;
  style?: CSSPropertiesLike;
  skip?: boolean;
};

export type CellPatchType<T = any> = Partial<CellType> & { value: T };
export type CellFilter = (cell: CellType) => boolean;

export type CellsByAddressType = { [address: string]: CellType };
export type CellsByIdType = { [id: Id]: CellType | undefined };
export type SystemsByIdType = { [id: Id]: System };

export type RangeType = { start: number; end: number }; // [start, end]
export type PointType = { y: Y; x: X }; // {y, x}
export type ExtraPointType = { y: Y; x: X; absY?: boolean; absX?: boolean; sheet?: Sheet };
export type PositionType = { y: Y; x: X }; // {y, x}
export type ZoneType = { startY: Y; startX: X; endY: Y; endX: X };
export type AreaType = { top: Y; left: X; bottom: Y; right: X };

export type WriterType = (value: string) => void;

export type Id = string;
export type Ids = Id[];
export type IdMatrix = Ids[];
export type Address = string;

export type MatricesByAddress<T> = { [origin: Address]: MatrixType<T> };

export type StorePatchType = {
  sheetId: number;
  choosing?: PointType;
  selectingZone?: ZoneType | undefined;
  sheetHeight?: number;
  sheetWidth?: number;
  transmit?: any;
};

export type HistoryUpdateType = {
  operation: 'UPDATE';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  diffBefore: CellsByIdType;
  diffAfter: CellsByIdType;
  partial: boolean;
};

export type MoveRelation = {
  before?: string; // policy before
  after?: string; // policy after
  src: Address; // address
  dst?: Address; // address
  new?: Id; // id
  lost?: Id; // id
};
export type MoveRelations = MoveRelation[];

export type HistoryMoveType = {
  operation: 'MOVE';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  diffBefore: CellsByIdType;
  diffAfter: CellsByIdType;
  moveRelations: MoveRelations;
};

export type HistoryInsertRowsType = {
  operation: 'INSERT_ROWS';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryRemoveRowsType = {
  operation: 'REMOVE_ROWS';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  ys: number[];
  diffBefore?: CellsByIdType;
  deleted: IdMatrix;
};

export type HistoryInsertColsType = {
  operation: 'INSERT_COLS';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryRemoveColsType = {
  operation: 'REMOVE_COLS';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  xs: number[];
  diffBefore?: CellsByIdType;
  deleted: IdMatrix;
};

export type HistorySortRowsType = {
  operation: 'SORT_ROWS';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  /** Mapping from original row index to new row index after sort */
  sortedRowMapping: { [beforeY: number]: number };
};

export type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryInsertRowsType
  | HistoryRemoveRowsType
  | HistoryInsertColsType
  | HistoryRemoveColsType
  | HistorySortRowsType;

export type Virtualization = {
  xs: number[];
  ys: number[];
  adjuster: AreaType;
};
export type OperatorType = 'USER' | 'SYSTEM';

export type OperationType = number;

/**
 * Framework-agnostic dispatcher type.
 * React-core defines the concrete version using React.Dispatch.
 */
export type Dispatcher = (action: { type: number; value: any }) => void;

export type StoreDispatchType = {
  store: any;
  dispatch: Dispatcher;
};
export type ContextsBySheetId = { [sheetId: string]: StoreDispatchType }; // id: { store, apply }
export type SheetIdsByName = { [sheetName: string]: number }; // name: id

export type RefPaletteType = { [address: string]: number };

/**
 * Framework-agnostic editor event type.
 * Covers the common subset of native KeyboardEvent and framework synthetic events (React, Preact).
 */
export interface EditorEvent {
  key: string;
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  target: EventTarget | null;
  preventDefault(): void;
  stopPropagation(): void;
}
