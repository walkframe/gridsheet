import { RendererType } from "./renderers/core";
import { ParserType } from "./parsers/core";
import { UserTable, Table } from "./lib/table";
import { FunctionMapping } from "./formula/functions/__base";
import React from "react";

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
  }
) => void;

export type FeedbackTypeForMatrix = (coordinate: {
  y?: Y;
  x?: X;
  num: number;
}) => void;

export type Mode = "light" | "dark";
export type Headers = "both" | "vertical" | "horizontal" | "none";

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
  changedAt?: Date;
};

export type CellFilter = (cell: CellType) => boolean;

export type CellsByAddressType = { [address: Address]: CellType };
export type CellsByIdType = { [id: Id]: CellType | undefined };


export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: "both" | "vertical" | "horizontal" | "none";
  historyLimit?: number;
  headerHeight?: number;
  headerWidth?: number;
  editingOnEnter?: boolean;
  showAddress?: boolean;
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
  table: Table;
  tableInitialized: boolean;
  sheetRef: React.MutableRefObject<HTMLDivElement>;
  editorRef: React.MutableRefObject<HTMLTextAreaElement>;
  gridOuterRef: React.MutableRefObject<HTMLDivElement>;
  searchInputRef: React.MutableRefObject<HTMLInputElement>;
  entering: boolean;
  choosing: PointType;
  cutting: boolean;
  copyingZone: ZoneType;
  selectingZone: ZoneType;
  headerTopSelecting: boolean;
  headerLeftSelecting: boolean;
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
  initial: CellsByAddressType;
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
  operation: "UPDATE";
  reflection?: StoreReflectionType;
  diffBefore: CellsByIdType;
  diffAfter: CellsByIdType;
  partial: boolean;
};

export type HistoryMoveType = {
  operation: "MOVE";
  reflection?: StoreReflectionType;
  matrixFrom: IdMatrix;
  matrixTo: IdMatrix;
  matrixNew: IdMatrix;
  pointFrom: PointType;
  pointTo: PointType;
  lostRows: MatricesByAddress<Id>;
};

export type HistoryAddRowsType = {
  operation: "ADD_ROWS";
  reflection?: StoreReflectionType;
  y: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryRemoveRowsType = {
  operation: "REMOVE_ROWS";
  reflection?: StoreReflectionType;
  y: number;
  idMatrix: IdMatrix;
};

export type HistoryAddColsType = {
  operation: "ADD_COLS";
  reflection?: StoreReflectionType;
  x: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryRemoveColsType = {
  operation: "REMOVE_COLS";
  reflection?: StoreReflectionType;
  x: number;
  idMatrix: IdMatrix;
};

export type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryAddRowsType
  | HistoryRemoveRowsType
  | HistoryAddColsType
  | HistoryRemoveColsType;
