import type { RendererType } from './renderers/core';
import type { ParserType } from './parsers/core';
import type { UserTable, Table } from './lib/table';
import type { FC, RefObject } from 'react';
import type { HubType, TransmitProps } from './lib/hub';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { PolicyType } from './policy/core';
import type { Dispatcher } from './store';

export type RefEvaluation = 'COMPLETE' | 'TABLE' | 'RAW' | 'SYSTEM';

export type Y = number;
export type X = number;

export type Height = number;
export type Width = number;

export type ShapeType = { height: Height; width: Width };

export type RectType = { y: Y; x: X; height: Height; width: Width };

export type MatrixType<T = any> = T[][];

export type Labeler = (n: number) => string;

export type Renderers = { [s: string]: RendererType };
export type Parsers = { [s: string]: ParserType };
export type Labelers = { [s: string]: Labeler };
export type Policies = { [s: string]: PolicyType };

export type CursorStateType = {
  pointing: PointType;
  selectingFrom: PointType;
  selectingTo: PointType;
};

export type FeedbackType = (args: { table: UserTable; points?: CursorStateType }) => void;

export type ModeType = 'light' | 'dark';
export type HeadersType = 'both' | 'vertical' | 'horizontal' | 'none';

export type System = {
  id: string;
  sheetId: number;
  changedAt: Date;
  dependents: Set<string>;
};

export type CellType<T = any, Custom = any> = {
  value?: T;
  style?: CSSProperties;
  justifyContent?: CSSProperties['justifyContent'];
  alignItems?: CSSProperties['alignItems'];
  labeler?: string;
  width?: Width;
  height?: Height;
  renderer?: string;
  parser?: string;
  policy?: string;
  custom?: Custom;
  disableFormula?: boolean;
  prevention?: OperationType;
  system?: System;
};

export type RawCellType = {
  value?: string;
  style?: CSSProperties;
  skip?: boolean;
};

export type CellPatchType = CellType;
export type CellFilter = (cell: CellType) => boolean;

export type CellsByAddressType = { [address: string]: CellType };
export type CellsByIdType = { [id: Id]: CellType | undefined };

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: CSSProperties['resize'];
  editingOnEnter?: boolean;
  showAddress?: boolean;
  showFormulaBar?: boolean;
  minNumRows?: number;
  maxNumRows?: number;
  minNumCols?: number;
  maxNumCols?: number;
  mode?: ModeType;
  contextMenuItems?: FC<ContextMenuProps>[];
};

export type RangeType = { start: number; end: number }; // [start, end]
export type PointType = { y: Y; x: X }; // {y, x}
export type ExtraPointType = { y: Y; x: X; absY?: boolean; absX?: boolean; table?: Table };
export type PositionType = { y: Y; x: X }; // {y, x}
export type ZoneType = { startY: Y; startX: X; endY: Y; endX: X };
export type AreaType = { top: Y; left: X; bottom: Y; right: X };

export type WriterType = (value: string) => void;

export type StoreType = {
  sheetId: number;
  tableReactive: RefObject<Table>;
  rootRef: RefObject<HTMLDivElement>;
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
  minNumRows: number;
  maxNumRows: number;
  minNumCols: number;
  maxNumCols: number;
  mode: ModeType;
  searchQuery?: string;
  searchCaseSensitive: boolean;
  matchingCells: string[];
  matchingCellIndex: number;
  editingOnEnter: boolean;
  showAddress: boolean;
  contextMenuPosition: PositionType;
  contextMenuItems: FC<ContextMenuProps>[];
  resizingPositionY: [Y, Y, Y]; // indexY, startY, endY
  resizingPositionX: [X, X, X]; // indexX, startX, endX
};

export type Manager<T> = {
  instance: T;
  sync: T extends StoreType ? Dispatcher : (instance: T) => void;
};

export type Connector = {
  tableManager: {
    table: UserTable;
    sync: (table: UserTable) => void;
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
  hub?: HubType;
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

export type HistoryMoveType = {
  operation: 'MOVE';
  srcSheetId: number;
  dstSheetId: number;
  applyed: boolean;
  undoReflection?: StorePatchType;
  redoReflection?: StorePatchType;
  diffBefore: CellsByIdType;
  diffAfter: CellsByIdType;
  src: AreaType;
  dst: AreaType;
  matrixFrom: IdMatrix;
  matrixTo: IdMatrix;
  matrixNew: IdMatrix;
  lostRows: MatricesByAddress<Id>;
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

export type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryInsertRowsType
  | HistoryRemoveRowsType
  | HistoryInsertColsType
  | HistoryRemoveColsType;

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
