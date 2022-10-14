import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { RendererType } from "./renderers/core";
import { ParserType } from "./parsers/core";
import { UserTable, Table } from "./api/table";
import { FunctionMapping } from "./formula/functions/__base";

export type Y = number;
export type X = number;
export type Point = [Y, X];

export type Height = number;
export type Width = number;

export type RectType = [Y, X, Height, Width];

export type MatrixType = any[][];

export type Renderers = { [s: string]: RendererType };
export type Parsers = { [s: string]: ParserType };

export type HistoryOperationType =
  | "WRITE"
  | "COPY"
  | "CUT"
  | "ADD_ROW"
  | "ADD_COL"
  | "REMOVE_ROW"
  | "REMOVE_COL";

export type Feedback = (
  table: UserTable,
  positions?: {
    pointing: PositionType;
    selectingFrom: PositionType;
    selectingTo: PositionType;
  }
) => void;

export type FeedbackForMatrix = (coordinate: {
  y?: number;
  x?: number;
  num: number;
}) => void;

export type Mode = "light" | "dark";
export type Headers = "both" | "vertical" | "horizontal" | "none";

export type Labeling = (n: number) => string;

export type CellType<Custom = any> = {
  value?: any;
  style?: React.CSSProperties;
  verticalAlign?: string;
  label?: string | Labeling;
  width?: number;
  height?: number;
  renderer?: string;
  parser?: string;
  custom?: Custom;
  changedAt?: Date;
};

export type CellsType = { [address: Address]: CellType };
export type DiffType = CellsType;
export type DataType = Map<Id, CellType | undefined>;

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: "both" | "vertical" | "horizontal" | "none";
  historySize?: number;
  headerHeight?: number;
  headerWidth?: number;
  editingOnEnter?: boolean;
  cellLabel?: boolean;
  numRows?: number;
  numCols?: number;
  mode?: Mode;
  renderers?: Renderers;
  parsers?: Parsers;
  onSave?: Feedback;
  onChange?: Feedback;
  onChangeDiff?: Feedback;
  onChangeDiffNumMatrix?: FeedbackForMatrix;
  onSelect?: Feedback;
};

export type RangeType = [number, number]; // [start, end]
export type PositionType = [Y, X]; // [y, x]
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
  choosing?: PositionType;
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
  choosing: PositionType;
  cutting: boolean;
  copyingZone: ZoneType;
  selectingZone: ZoneType;
  horizontalHeadersSelecting: boolean;
  verticalHeadersSelecting: boolean;
  editingCell: string;
  history: HistoryType;
  editorRect: RectType;
  resizingRect: RectType;
  sheetHeight: number;
  sheetWidth: number;
  headerHeight: number;
  headerWidth: number;
  searchQuery?: string;
  matchingCells: string[];
  matchingCellIndex: number;
  editingOnEnter: boolean;
  cellLabel: boolean;
  contextMenuPosition: [Y, X];
  resizingPositionY: [Y, Y, Y]; // indexY, startY, endY
  resizingPositionX: [X, X, X]; // indexX, startX, endX
  onSave?: Feedback;
};

export type Props = {
  initial?: CellsType;
  changes?: CellsType;
  options?: OptionsType;
  className?: string;
  style?: React.CSSProperties;
  additionalFunctions?: FunctionMapping;
};

export type Id = number | bigint;
export type Ids = Id[];
export type IdMatrix = Ids[];
export type Address = string;
