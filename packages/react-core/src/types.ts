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
import type { ModeType, PointType, ZoneType, RectType, PositionType, CellsByAddressType } from '@gridsheet/core';
import type { SheetLimits } from '@gridsheet/core';

export type Policies = { [s: string]: PolicyType };

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: CSSProperties['resize'];
  editingOnEnter?: boolean;
  showFormulaBar?: boolean;
  limits?: SheetLimits;
  mode?: ModeType;
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
