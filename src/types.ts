import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { RendererType } from "./renderers/core";
import { ParserType } from "./parsers/core";
import { UserTable, Table } from "./api/table";
import { FunctionMapping } from "./formula/functions/__base";
import React from "react";

export type Y = number;
export type X = number;

export type Height = number;
export type Width = number;

export type RectType = [Y, X, Height, Width];

export type MatrixType = any[][];

export type Labeler = (n: number) => string;

export type Renderers = { [s: string]: RendererType };
export type Parsers = { [s: string]: ParserType };
export type Labelers = { [s: string]: Labeler };

export type HistoryOperationType =
  | "WRITE"
  | "COPY"
  | "MOVE"
  | "ADD_ROW"
  | "ADD_COL"
  | "REMOVE_ROW"
  | "REMOVE_COL";

export type FeedbackType = (
  table: UserTable,
  positions?: {
    pointing: PointType;
    selectingFrom: PointType;
    selectingTo: PointType;
  }
) => void;

export type FeedbackTypeForMatrix = (coordinate: {
  y?: number;
  x?: number;
  num: number;
}) => void;

export type Mode = "light" | "dark";
export type Headers = "both" | "vertical" | "horizontal" | "none";

export type CellType<Custom = any> = {
  value?: any;
  style?: React.CSSProperties;
  verticalAlign?: string;
  labeler?: string;
  width?: number;
  height?: number;
  renderer?: string;
  parser?: string;
  custom?: Custom;
  changedAt?: Date;
};

export type CellFilter = (cell: CellType) => boolean;

export type CellsType = { [address: Address]: CellType };
export type DiffType = CellsType;
export type DataType = Map<Id, CellType | undefined>;

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: "both" | "vertical" | "horizontal" | "none";
  historyLimit?: number;
  headerHeight?: number;
  headerWidth?: number;
  editingOnEnter?: boolean;
  cellLabel?: boolean;
  numRows?: number;
  numCols?: number;
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
  onChangeDiff?: FeedbackType;
  onChangeDiffNumMatrix?: FeedbackTypeForMatrix;
  onSelect?: FeedbackType;
};

export type RangeType = [number, number]; // [start, end]
export type PointType = [Y, X]; // [y, x]
export type ZoneType = [Y, X, Y, X]; // [startY, startX, endY, endX]
export type AreaType = ZoneType; // [top, left, bottom, right] (subtype of ZoneType)

export type Direction = "FORWARD" | "BACKWARD";
export type HistoryType = {
  index: number;
  size: number;
  operations: OperationType[];
  direction: Direction;
};

export type OperationCommandType =
  | "SET_TABLE"
  | "ADD_ROWS"
  | "REMOVE_ROWS"
  | "ADD_COLS"
  | "REMOVE_COLS";

export type OperationType = {
  command: OperationCommandType;
  before: any;
  after: any;
  choosing?: PointType;
  selectingZone?: ZoneType;
  copyingZone?: ZoneType;
  cutting?: boolean;
};

export type WriterType = (value: string) => void;

export type StoreType = {
  table: Table;
  tableInitialized: boolean;
  sheetRef: React.MutableRefObject<HTMLDivElement>;
  editorRef: React.MutableRefObject<HTMLTextAreaElement>;
  gridOuterRef: React.MutableRefObject<HTMLDivElement>;
  searchInputRef: React.MutableRefObject<HTMLInputElement>;
  gridRef: React.MutableRefObject<Grid | null>;
  verticalHeadersRef: React.MutableRefObject<List | null>;
  horizontalHeadersRef: React.MutableRefObject<List | null>;
  entering: boolean;
  choosing: PointType;
  cutting: boolean;
  copyingZone: ZoneType;
  selectingZone: ZoneType;
  horizontalHeadersSelecting: boolean;
  verticalHeadersSelecting: boolean;
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
  cellLabel: boolean;
  contextMenuPosition: [Y, X];
  resizingPositionY: [Y, Y, Y]; // indexY, startY, endY
  resizingPositionX: [X, X, X]; // indexX, startX, endX
  onSave?: FeedbackType;
};

export type Props = {
  initial?: CellsType;
  tableRef?: React.MutableRefObject<UserTable | null>;
  options?: OptionsType;
  className?: string;
  style?: React.CSSProperties;
  additionalFunctions?: FunctionMapping;
};

export type Id = number | bigint;
export type Ids = Id[];
export type IdMatrix = Ids[];
export type Address = string;

export type RowByAddress<T> = Map<Address, T[]>;
