// Re-export all core types
export type {
  CSSPropertiesLike,
  RefLike,
  Resolution,
  Y,
  X,
  Height,
  Width,
  ShapeType,
  RectType,
  MatrixType,
  CursorStateType,
  FeedbackType,
  ModeType,
  HeadersType,
  AsyncCache,
  System,
  FilterConditionMethod,
  FilterCondition,
  FilterConfig,
  CellType,
  RawCellType,
  CellPatchType,
  CellFilter,
  CellsByAddressType,
  CellsByIdType,
  SystemsByIdType,
  RangeType,
  PointType,
  ExtraPointType,
  PositionType,
  ZoneType,
  AreaType,
  WriterType,
  Id,
  Ids,
  IdMatrix,
  Address,
  MatricesByAddress,
  StorePatchType,
  HistoryUpdateType,
  MoveRelation,
  MoveRelations,
  HistoryMoveType,
  HistoryInsertRowsType,
  HistoryRemoveRowsType,
  HistoryInsertColsType,
  HistoryRemoveColsType,
  HistorySortRowsType,
  HistoryType,
  Virtualization,
  OperatorType,
  OperationType,
  Dispatcher,
  StoreDispatchType,
  ContextsBySheetId,
  SheetIdsByName,
  RefPaletteType,
} from '@gridsheet/core';

// React-specific types
import type { RefObject, CSSProperties, KeyboardEvent } from 'react';
import type { Sheet, UserSheet } from '@gridsheet/core';
import type { BookType } from '@gridsheet/core';
import type { PolicyType } from '@gridsheet/core';
import type { ContextMenuItemDescriptor, RowMenuItemDescriptor, ColMenuItemDescriptor } from './lib/menu';
import type {
  ModeType,
  DensityType,
  GridLinesType,
  PointType,
  ZoneType,
  RectType,
  PositionType,
  CellsByAddressType,
} from '@gridsheet/core';
import type { SheetLimits } from '@gridsheet/core';

export type Policies = { [s: string]: PolicyType };

/**
 * Border visibility per side. `all` sets every side; a specific side overrides `all`.
 * e.g. { all: true, bottom: false } => every side except bottom.
 */
export type BorderSides = {
  all?: boolean;
  left?: boolean;
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
};

export type OptionsType = {
  // A number is treated as a fixed pixel size.
  // A string is passed through as a CSS dimension (e.g. '100%', '80vh', 'calc(100% - 40px)'),
  // letting the sheet fill its parent; the actual pixel size is measured via ResizeObserver.
  sheetHeight?: number | string;
  sheetWidth?: number | string;
  sheetResize?: CSSProperties['resize'];
  editingOnEnter?: boolean;
  showFormulaBar?: boolean;
  /**
   * Opt into eager resolution for this sheet: solve every formula cell
   * regardless of the visible range, so off-screen async formulas fire instead
   * of waiting to be scrolled into view. OFF by default to preserve
   * virtualization. See `Sheet.eager` / `Sheet.resolveAll()`.
   */
  eager?: boolean;
  limits?: SheetLimits;
  mode?: ModeType;
  /** Cell spacing. 'compact' (default) keeps the current metrics; 'comfortable' roomier. */
  density?: DensityType;
  /** Grid line visibility. 'all' (default) | 'horizontal' (no vertical lines) | 'none'. */
  gridLines?: GridLinesType;
  /** Which sides of the formula bar draw a border. Default: { all: true }. */
  formulaBarBorders?: BorderSides;
  /** Which sides of the matrix (cell grid) draw an outer border. Default: { all: true }. */
  matrixBorders?: BorderSides;
  contextMenu?: ContextMenuItemDescriptor[];
  rowMenu?: RowMenuItemDescriptor[];
  colMenu?: ColMenuItemDescriptor[];
};

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
  // Whether sheetWidth/sheetHeight were explicitly configured (number or fill string).
  // When true the tabular keeps that box size and centers a smaller grid within it;
  // when false it shrinks to the content.
  fixedWidth: boolean;
  fixedHeight: boolean;
  mode: ModeType;
  searchQuery?: string;
  searchCaseSensitive: boolean;
  searchRegex: boolean;
  searchRange?: ZoneType;
  matchingCells: string[];
  matchingCellIndex: number;
  editingOnEnter: boolean;
  contextMenuPosition: PositionType;
  contextMenu: ContextMenuItemDescriptor[];
  rowMenu: RowMenuItemDescriptor[];
  colMenu: ColMenuItemDescriptor[];
  resizingPositionY: [number, number, number]; // indexY, startY, endY
  resizingPositionX: [number, number, number]; // indexX, startX, endX
  columnMenuState: { x: number; position: PositionType } | null;
  rowMenuState: { y: number; position: PositionType } | null;
  editorHovering: boolean;
};

export type Manager<T> = {
  instance: T;
  sync: T extends StoreType ? React.Dispatch<{ type: number; value: any }> : (instance: T) => void;
};

export type SheetHandle = {
  sheet: UserSheet;
  apply: (sheet: UserSheet) => void;
};

export type StoreHandle = {
  store: StoreType;
  apply: (store: StoreType) => void;
  dispatch: React.Dispatch<{ type: number; value: any }>;
};

export type Props = {
  initialCells: CellsByAddressType;
  sheetName?: string;
  book?: BookType;
  sheetRef?: RefObject<SheetHandle | null>;
  storeRef?: RefObject<StoreHandle | null>;
  options?: OptionsType;
  className?: string;
  style?: CSSProperties;
};

export type EditorEvent = KeyboardEvent<HTMLTextAreaElement>;
export type EditorEventWithNativeEvent = EditorEvent & {
  nativeEvent: KeyboardEvent & { isComposing: boolean };
};
