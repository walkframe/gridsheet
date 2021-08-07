import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { RendererType } from "./renderers/core";
import { ParserType } from "./parsers/core";

export type Y = number;
export type X = number;

export type Height = number;
export type Width = number;

export type RectType = [Y, X, Height, Width];

export type CellType = any;
export type MatrixType = CellType[][];

export type Renderers = { [s: string]: RendererType };
export type Parsers = { [s: string]: ParserType };

// All fields have to be primitive types.
export type CellOptionType = {
  label?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  verticalAlign?: string;
  renderer?: string;
  parser?: string;
  fixed?: boolean;
};

export type CellsOptionType = { [s: string]: CellOptionType };

export type Feedback = (
  matrix?: MatrixType,
  cellOptions?: CellsOptionType,
  positions?: {pointing: PositionType, selectingFrom: PositionType, selectingTo: PositionType},
) => void;

export type Mode = "light" | "dark";
export type Headers = "both" | "vertical" | "horizontal" | "none";

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
  sheetResize?: "both" | "vertical" | "horizontal" | "none";
  historySize?: number;
  headerHeight?: number;
  headerWidth?: number;
  editingOnEnter?: boolean;
  cellLabel?: boolean;
  cells?: CellsOptionType;
  mode?: Mode;
  renderers?: Renderers;
  parsers?: Parsers;
  onSave?: Feedback;
  onChange?: Feedback;
  onSelect?: Feedback;
};

export type RangeType = [number, number]; // [start, end]
export type PositionType = [Y, X]; // [y, x]
export type ZoneType = [Y, X, Y, X]; // [startY, startX, endY, endX]
export type AreaType = ZoneType; // [top, left, bottom, right] (subtype of ZoneType)

export type HistoryType = {
  index: number;
  size: number;
  operations: OperationType[];
};

export type OperationCommandType =
  | "write"
  | "copy"
  | "cut"
  | "addRows"
  | "delRows"
  | "addCols"
  | "delCols"
  | "styling";

export type OperationType = {
  command: OperationCommandType;
  src: AreaType;
  dst: AreaType;
  before: MatrixType;
  after: MatrixType;
  options?: CellsOptionType;
};

export type ReactionsType = { [s: string]: boolean };

export type Writer = (value: string) => void;

export type FlattenedType = { [s: string]: any };

export type StoreType = {
  sheetRef: React.MutableRefObject<HTMLDivElement>;
  editorRef: React.MutableRefObject<HTMLTextAreaElement>;
  gridOuterRef: React.MutableRefObject<HTMLDivElement>;
  searchInputRef: React.MutableRefObject<HTMLInputElement>;
  gridRef: React.MutableRefObject<Grid | null>;
  verticalHeadersRef: React.MutableRefObject<List | null>;
  horizontalHeadersRef: React.MutableRefObject<List | null>;
  entering: boolean;
  matrix: MatrixType;
  cellsOption: { [s: string]: CellOptionType };
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
  renderers: Renderers;
  parsers: Parsers;
  editingOnEnter: boolean;
  cellLabel: boolean;
  contextMenuPosition: [Y, X];
  resizingPositionY: [Y, Y, Y]; // indexY, startY, endY
  resizingPositionX: [X, X, X]; // indexX, startX, endX
  onChange?: Feedback;
  onSave?: Feedback;
  onSelect?: Feedback;
};
