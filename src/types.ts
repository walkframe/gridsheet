import { RendererType } from "./renderers/core";
import { ParserType } from "./parsers/core";

export type Y = number;
export type X = number;

export type CellType = any;
export type MatrixType = CellType[][];

export type CellOptionType = {
  label?: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  verticalAlign?: string;
  renderer?: RendererType;
  parser?: ParserType;
};

export type CellsOptionType = {[s: string]: CellOptionType};

export interface OptionsType {
  historySize?: number;
  defaultHeight?: string;
  defaultWidth?: string;
  headerHeight?: string;
  headerWidth?: string;
  editingOnEnter?: boolean;
  cellLabel?: boolean;
  cells?: CellsOptionType;
  onSave?: (matrix: MatrixType, options: OptionsType) => void;
  onChange?: (matrix: MatrixType, options: OptionsType) => void;
};

export interface Props {
  data: MatrixType;
  options?: OptionsType;
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

export type OperationCommandType = "write" | "copy" | "cut" | "addRows" | "delRows" | "addCols" | "delCols";

export type OperationType = {
  command: OperationCommandType;
  src: AreaType;
  dst: AreaType;
  before: MatrixType;
  after: MatrixType;
};

export type ReactionsType = {[s: string]: boolean};