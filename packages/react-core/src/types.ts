import type { UserSheet, Sheet, SheetLimits } from './lib/sheet';
import type { FC, RefObject } from 'react';
import type { BookType, TransmitProps } from './lib/hub';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { PolicyType } from './policy/core';
import type { Dispatcher } from './store';

export type RefEvaluation = 'COMPLETE' | 'TABLE' | 'RAW' | 'SYSTEM';

export type Y = number;
export type X = number;

export type Height = number;
export type Width = number;

export type ShapeType = { rows: number; cols: number };

export type RectType = { y: Y; x: X; height: Height; width: Width };

export type MatrixType<T = any> = T[][];

export type Policies = { [s: string]: PolicyType };

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
  style?: CSSProperties;
  justifyContent?: CSSProperties['justifyContent'];
  alignItems?: CSSProperties['alignItems'];
  label?: string;
  width?: Width;
  height?: Height;
  policy?: string;
  custom?: Custom;
  formulaEnabled?: boolean;
  prevention?: OperationType;
  /** Cached result from an async formula. Stored directly on the cell for serializability. */
  asyncCaches?: Record<string, AsyncCache>;
  /** Filter configuration. Set on col-header cells (y=0). */
  filter?: FilterConfig;
  /** Whether this row is hidden by a filter. Set on row-header cells (x=0). */
  filtered?: boolean;
};

export type RawCellType = {
  value?: string;
  style?: CSSProperties;
  skip?: boolean;
};

export type CellPatchType<T = any> = Partial<CellType> & { value: T };
export type CellFilter = (cell: CellType) => boolean;

export type CellsByAddressType = { [address: string]: CellType };
export type CellsByIdType = { [id: Id]: CellType | undefined };
export type SystemsByIdType = { [id: Id]: System };

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: CSSProperties['resize'];
  editingOnEnter?: boolean;
  showAddress?: boolean;
  showFormulaBar?: boolean;
  limits?: SheetLimits;
  mode?: ModeType;
  contextMenuItems?: FC<ContextMenuProps>[];
};

export type RangeType = { start: number; end: number }; // [start, end]
export type PointType = { y: Y; x: X }; // {y, x}
export type ExtraPointType = { y: Y; x: X; absY?: boolean; absX?: boolean; sheet?: Sheet };
export type PositionType = { y: Y; x: X }; // {y, x}
export type ZoneType = { startY: Y; startX: X; endY: Y; endX: X };
export type AreaType = { top: Y; left: X; bottom: Y; right: X };

export type WriterType = (value: string) => void;

export type StoreType = {
  sheetId: number;
  sheetReactive: RefObject<Sheet>;
  rootRef: RefObject<HTMLDivElement>;
  flashRef: RefObject<HTMLDivElement>;
  mainRef: RefObject<HTMLDivElement>;
  editorRef: RefObject<HTMLTextAreaElement>;
  largeEditorRef: RefObject<HTMLTextAreaElement>;
  tabularRef: RefObject<HTMLDivElement>;
  searchInputRef: RefObject<HTMLTextAreaElement>;
  entering: boolean;
  choosing: PointType;
  inputting: string;
  selectingZone: ZoneType;
  autofillDraggingTo: PointType | null;
  leftHeaderSelecting: boolean;
  topHeaderSelecting: boolean;
  editingAddress: string;
  editorRect: RectType;
  dragging: boolean;
  sheetHeight: number;
  sheetWidth: number;
  mode: ModeType;
  searchQuery?: string;
  searchCaseSensitive: boolean;
  searchRegex: boolean;
  searchRange?: ZoneType;
  matchingCells: string[];
  matchingCellIndex: number;
  editingOnEnter: boolean;
  showAddress: boolean;
  contextMenuPosition: PositionType;
  contextMenuItems: FC<ContextMenuProps>[];
  resizingPositionY: [Y, Y, Y]; // indexY, startY, endY
  resizingPositionX: [X, X, X]; // indexX, startX, endX
  columnMenuState: { x: number; position: PositionType } | null;
  rowMenuState: { y: number; position: PositionType } | null;
  editorHovering: boolean;
};

export type Manager<T> = {
  instance: T;
  sync: T extends StoreType ? Dispatcher : (instance: T) => void;
};

export type Connector = {
  sheetManager: {
    sheet: UserSheet;
    sync: (sheet: UserSheet) => void;
  };
  storeManager: {
    store: StoreType;
    sync: (store: StoreType) => void;
    dispatch: Dispatcher;
  };
};

export type Props = {
  initialCells: CellsByAddressType;
  sheetName?: string;
  book?: BookType;
  connector?: RefObject<Connector | null>;
  options?: OptionsType;
  className?: string;
  style?: CSSProperties;
};

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
  transmit?: TransmitProps;
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

export type StoreDispatchType = {
  store: StoreType;
  dispatch: Dispatcher;
};
export type ContextsBySheetId = { [sheetId: string]: StoreDispatchType }; // id: { store, sync }
export type SheetIdsByName = { [sheetName: string]: number }; // name: id

export type RefPaletteType = { [address: string]: number };

export type EditorEvent = KeyboardEvent<HTMLTextAreaElement>;
export type EditorEventWithNativeEvent = EditorEvent & {
  nativeEvent: KeyboardEvent & { isComposing: boolean };
};

export type ContextMenuProps = StoreDispatchType;
