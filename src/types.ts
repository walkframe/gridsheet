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
  cellOptions?: CellsOptionType
) => void;

export type Mode = "light" | "dark";
export type Headers = "both" | "vertical" | "horizontal" | "none";

export type OptionsType = {
  sheetHeight?: number;
  sheetWidth?: number;
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
};

export type InsideState = {
  matrix: MatrixType;
  cellsOption: { [s: string]: CellOptionType };
  choosing: PositionType;
  lastChoosing: PositionType;
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
  entering: boolean;
  searchQuery?: string;
  matchingCells: string[];
  matchingCellIndex: number;
  renderers: Renderers;
  parsers: Parsers;
};

export type OutsideState = {
  editingOnEnter: boolean;
  cellLabel: boolean;
  contextMenuPosition: [number, number];
  onSave?: Feedback;
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
  editorRef: React.RefObject<HTMLTextAreaElement>;
  gridRef: React.RefObject<Grid>;
  gridOuterRef: React.RefObject<HTMLDivElement>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  verticalHeadersRef: React.RefObject<List>;
  horizontalHeadersRef: React.RefObject<List>;
};

export type ActionType = {
  type: string;
  payload: any;
};
