
import { RendererType } from './renderers/core';
import { ParserType } from './parsers/core';
import { UserTable, Table } from './lib/table';
import { FunctionMapping } from './formula/functions/__base';
import { JSX, RefObject } from 'react';
import { SheetConnector } from './lib/connector';
import { CSSProperties, KeyboardEvent } from 'react';
import { PolicyType } from './policy/core';

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

export type TableRef = {
  table: UserTable;
  dispatch: (table: UserTable) => void;
};

export type CursorStateType = {
  pointing: PointType;
  selectingFrom: PointType;
  selectingTo: PointType;
};

export type FeedbackType = (table: UserTable, points?: CursorStateType) => void;

export type ModeType = 'light' | 'dark';
export type HeadersType = 'both' | 'vertical' | 'horizontal' | 'none';

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
  system?: {
    id: string;
    changedAt: Date;
    dependents: Set<string>;
  };
};

export type CellFilter = (cell: CellType) => boolean;

export type CellsByAddressType = { [address: string]: CellType };
export type CellsByIdType = { [id: Id]: CellType | undefined };

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: CSSProperties['resize'];
  historyLimit?: number;
  headerHeight?: number;
  headerWidth?: number;
  editingOnEnter?: boolean;
  showAddress?: boolean;
  showFormulaBar?: boolean;
  minNumRows?: number;
  maxNumRows?: number;
  minNumCols?: number;
  maxNumCols?: number;
  mode?: ModeType;
  renderers?: Renderers;
  parsers?: Parsers;
  labelers?: Labelers;
  policies?: Policies;
  onSave?: FeedbackType;
  onChange?: FeedbackType;
  onSelect?: FeedbackType;
  onKeyUp?: (e: EditorEvent, points: CursorStateType) => void;
  onInit?: (table: UserTable) => void;
  additionalFunctions?: FunctionMapping;
};

export type RangeType = { start: number; end: number }; // [start, end]
export type PointType = { y: Y; x: X }; // {y, x}
export type PositionType = { y: Y; x: X }; // {y, x}
export type ZoneType = { startY: Y; startX: X; endY: Y; endX: X };
export type AreaType = { top: Y; left: X; bottom: Y; right: X };

export type WriterType = (value: string) => void;

export type StoreType = {
  sheetId: number;
  table: Table;
  rootRef: RefObject<HTMLDivElement>;
  mainRef: RefObject<HTMLDivElement>;
  editorRef: RefObject<HTMLTextAreaElement>;
  largeEditorRef: RefObject<HTMLTextAreaElement>;
  tabularRef: RefObject<HTMLDivElement>;
  searchInputRef: RefObject<HTMLTextAreaElement>;
  lastEdited: string;
  entering: boolean;
  choosing: PointType;
  cutting: boolean;
  inputting: string;
  copyingZone: ZoneType;
  selectingZone: ZoneType;
  autofillDraggingTo: PointType | null;
  leftHeaderSelecting: boolean;
  topHeaderSelecting: boolean;
  editingAddress: string;
  editorRect: RectType;
  resizingRect: RectType;
  sheetHeight: number;
  sheetWidth: number;
  headerHeight: number;
  headerWidth: number;
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
  resizingPositionY: [Y, Y, Y]; // indexY, startY, endY
  resizingPositionX: [X, X, X]; // indexX, startX, endX
  onSave?: FeedbackType;
};

export type Props = {
  initialCells: CellsByAddressType;
  sheetName?: string;
  connector?: SheetConnector;
  tableRef?: RefObject<TableRef | null>;
  options?: OptionsType;
  className?: string;
  style?: CSSProperties;
};

export type Id = string;
export type Ids = Id[];
export type IdMatrix = Ids[];
export type Address = string;

export type MatricesByAddress<T> = { [origin: Address]: MatrixType<T> };

export type StoreReflectionType = {
  choosing?: PointType;
  cutting?: boolean;
  copyingZone?: ZoneType;
  selectingZone?: ZoneType | undefined;
};

export type HistoryUpdateType = {
  operation: 'UPDATE';
  applyed: boolean;
  reflection?: StoreReflectionType;
  diffBefore: CellsByIdType;
  diffAfter: CellsByIdType;
  partial: boolean;
};

export type HistoryMoveType = {
  operation: 'MOVE';
  applyed: boolean;
  reflection?: StoreReflectionType;
  src: AreaType;
  dst: AreaType;
  matrixFrom: IdMatrix;
  matrixTo: IdMatrix;
  matrixNew: IdMatrix;
  lostRows: MatricesByAddress<Id>;
};

export type HistoryAddRowsType = {
  operation: 'ADD_ROWS';
  applyed: boolean;
  reflection?: StoreReflectionType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryDeleteRowsType = {
  operation: 'DELETE_ROWS';
  applyed: boolean;
  reflection?: StoreReflectionType;
  ys: number[];
  deleted: IdMatrix;
};

export type HistoryAddColsType = {
  operation: 'ADD_COLS';
  applyed: boolean;
  reflection?: StoreReflectionType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryDeleteColsType = {
  operation: 'DELETE_COLS';
  applyed: boolean;
  reflection?: StoreReflectionType;
  xs: number[];
  deleted: IdMatrix;
};

export type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryAddRowsType
  | HistoryDeleteRowsType
  | HistoryAddColsType
  | HistoryDeleteColsType;

export type Virtualization = {
  xs: number[];
  ys: number[];
  adjuster: AreaType;
};
export type OperatorType = 'USER' | 'SYSTEM';

export type OperationType = number;

export type TablesBySheetId = { [sheetId: string]: Table }; // id: table
export type SheetIdsByName = { [sheetName: string]: number }; // name: id

export type RefPaletteType = { [address: string]: number };

export type EditorEvent = KeyboardEvent<HTMLTextAreaElement>;
;
export type EditorEventWithNativeEvent = EditorEvent & {
  nativeEvent: KeyboardEvent & { isComposing: boolean }
};