import { RendererType } from './renderers/core';
import { ParserType } from './parsers/core';
import { UserTable, Table } from './lib/table';
import { FunctionMapping } from './formula/functions/__base';
import React from 'react';

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

export type TableRef = {
  table: UserTable;
  dispatch: (table: UserTable) => void;
};

export type FeedbackType = (
  table: UserTable,
  points?: {
    pointing: PointType;
    selectingFrom: PointType;
    selectingTo: PointType;
  },
) => void;

export type Mode = 'light' | 'dark';
export type Headers = 'both' | 'vertical' | 'horizontal' | 'none';

export type CellType<Custom = any> = {
  value?: any;
  style?: React.CSSProperties;
  justifyContent?: React.CSSProperties['justifyContent'];
  alignItems?: React.CSSProperties['alignItems'];
  labeler?: string;
  width?: Width;
  height?: Height;
  renderer?: string;
  parser?: string;
  custom?: Custom;
  prevention?: Prevention;
  changedAt?: Date;
};

export type CellFilter = (cell: CellType) => boolean;

export type CellsByAddressType = { [address: string]: CellType };
export type CellsByIdType = { [id: Id]: CellType | undefined };

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: React.CSSProperties['resize'];
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
  mode?: Mode;
  renderers?: Renderers;
  parsers?: Parsers;
  labelers?: Labelers;
  onSave?: FeedbackType;
  onChange?: FeedbackType;
  onSelect?: FeedbackType;
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
  tableInitialized: boolean;
  sheetRef: React.MutableRefObject<HTMLDivElement | null>;
  editorRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  largeEditorRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  gridOuterRef: React.MutableRefObject<HTMLDivElement | null>;
  searchInputRef: React.MutableRefObject<HTMLInputElement | null>;
  entering: boolean;
  choosing: PointType;
  cutting: boolean;
  copyingZone: ZoneType;
  selectingZone: ZoneType;
  autofillDraggingTo: PointType | null;
  verticalHeaderSelecting: boolean;
  horizontalheaderSelecting: boolean;
  editingCell: string;
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
  searchQuery?: string;
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
  tableRef?: React.MutableRefObject<TableRef | null>;
  options?: OptionsType;
  className?: string;
  style?: React.CSSProperties;
  additionalFunctions?: FunctionMapping;
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

export type Prevention = number;

export type TableMapType = { [key: string]: Table }; // id: table
export type SheetMapType = { [key: string]: number }; // name: id
